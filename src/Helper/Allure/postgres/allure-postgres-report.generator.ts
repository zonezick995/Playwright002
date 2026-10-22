import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import type {
  AllureDatabaseReport,
  AllureReportAttachment,
  AllureReportStep,
  AllureReportTestCase,
} from "./allure-postgres.repository";
import { AllurePostgresRepository } from "./allure-postgres.repository";

const execFileAsync = promisify(execFile);

export interface GeneratedAllureReport {
  runId: number;
  resultsDir: string;
  reportDir: string;
  filePath: string;
  testCount: number;
}

interface AllureAttachmentReference {
  name: string;
  type: string | null;
  source: string;
}

interface AllureStepResult {
  name: string;
  uuid: string;
  status: string | null;
  statusDetails: unknown;
  stage: string | null;
  start: number | null;
  stop: number | null;
  parameters: Array<{
    name: string;
    value: string | null;
    excluded: boolean;
    mode: string | null;
  }>;
  attachments: AllureAttachmentReference[];
  steps: AllureStepResult[];
}

export class AllurePostgresReportGenerator {
  constructor(
    private readonly repository: AllurePostgresRepository,
    private readonly outputRoot = path.resolve(process.cwd(), "allure-db-reports"),
  ) {}

  async generate(runId?: number): Promise<GeneratedAllureReport> {
    const report = await this.repository.readReport(runId);
    if (!report) {
      throw new Error(
        runId === undefined
          ? "No Allure runs were found in PostgreSQL."
          : `Allure run ${runId} was not found in PostgreSQL.`,
      );
    }

    const resultsDir = path.join(this.outputRoot, `allure-results-${report.id}`);
    const reportDir = path.join(this.outputRoot, `allure-report-${report.id}`);

    await rm(resultsDir, { recursive: true, force: true });
    await rm(reportDir, { recursive: true, force: true });
    await mkdir(resultsDir, { recursive: true });

    for (const test of report.tests) {
      const resultJson = await this.toAllureResult(test, resultsDir);
      await writeFile(
        path.join(resultsDir, `${test.uuid}-result.json`),
        JSON.stringify(resultJson),
        "utf8",
      );
    }

    const environment = {
      ...report.environmentProperties,
      ...(report.environment ? { Environment: report.environment } : {}),
      ...(report.channel ? { Channel: report.channel } : {}),
    };
    if (Object.keys(environment).length > 0) {
      await writeFile(
        path.join(resultsDir, "environment.properties"),
        `${Object.entries(environment)
          .map(([key, value]) => `${this.escapeProperty(key)}=${this.escapeProperty(value)}`)
          .join("\n")}\n`,
        "utf8",
      );
    }

    if (report.categories.length > 0) {
      await writeFile(
        path.join(resultsDir, "categories.json"),
        JSON.stringify(report.categories),
        "utf8",
      );
    }

    if (report.executor) {
      await writeFile(
        path.join(resultsDir, "executor.json"),
        JSON.stringify(report.executor),
        "utf8",
      );
    }

    const historyDir = path.join(resultsDir, "history");
    const historyEntries = Object.entries(report.history);
    if (historyEntries.length > 0) {
      await mkdir(historyDir, { recursive: true });
      for (const [fileName, data] of historyEntries) {
        if (path.basename(fileName) !== fileName || !fileName.endsWith(".json")) {
          throw new Error(`Invalid Allure history file name stored in database: ${fileName}`);
        }
        await writeFile(path.join(historyDir, fileName), JSON.stringify(data), "utf8");
      }
    }

    await this.runAllureGenerate(resultsDir, reportDir);

    return {
      runId: report.id,
      resultsDir,
      reportDir,
      filePath: path.join(reportDir, "index.html"),
      testCount: report.tests.length,
    };
  }

  private async toAllureResult(
    test: AllureReportTestCase,
    resultsDir: string,
  ): Promise<Record<string, unknown>> {
    const [attachments, steps] = await Promise.all([
      this.writeAttachments(test.attachments, resultsDir),
      this.toAllureSteps(test.steps, resultsDir),
    ]);

    return {
      uuid: test.uuid,
      historyId: test.historyId,
      testCaseId: test.id.toString(),
      name: test.name,
      fullName: test.fullName,
      titlePath: test.titlePath,
      status: test.status ?? "unknown",
      statusDetails: test.statusDetails,
      stage: test.stage ?? "finished",
      start: this.toTimestamp(test.start),
      stop: this.toTimestamp(test.stop),
      parameters: test.parameters.map((parameter) => ({
        name: parameter.name,
        value: parameter.value,
        excluded: parameter.exclude,
        mode: parameter.mode,
      })),
      labels: test.labels,
      links: test.links
        .filter((link) => link.url != null)
        .map((link) => ({
          name: link.name,
          type: link.type,
          url: link.url,
        })),
      attachments,
      steps,
    };
  }

  private async toAllureSteps(
    steps: AllureReportStep[],
    resultsDir: string,
  ): Promise<AllureStepResult[]> {
    return Promise.all(
      steps.map(async (step) => ({
        name: step.description,
        uuid: step.uuid,
        status: step.status,
        statusDetails: step.statusDetails,
        stage: step.stage,
        start: this.toTimestamp(step.start),
        stop: this.toTimestamp(step.stop),
        parameters: step.parameters.map((parameter) => ({
          name: parameter.name,
          value: parameter.value,
          excluded: parameter.exclude,
          mode: parameter.mode,
        })),
        attachments: await this.writeAttachments(step.attachments, resultsDir),
        steps: await this.toAllureSteps(step.steps, resultsDir),
      })),
    );
  }

  private async writeAttachments(
    attachments: AllureReportAttachment[],
    resultsDir: string,
  ): Promise<AllureAttachmentReference[]> {
    return Promise.all(
      attachments.map(async (attachment) => {
        if (!attachment.data) {
          throw new Error(
            `Cannot generate Allure report: attachment "${attachment.name}" ` +
              `(database id ${attachment.id}) has no stored data.`,
          );
        }

        const extension = path.extname(attachment.name).replace(/[^.a-zA-Z0-9_-]/g, "");
        const source = `attachment-${attachment.id}${extension}`;
        await writeFile(path.join(resultsDir, source), attachment.data);

        return {
          name: attachment.name,
          type: attachment.type,
          source,
        };
      }),
    );
  }

  private async runAllureGenerate(resultsDir: string, reportDir: string): Promise<void> {
    const allureExecutable = path.resolve(
      process.cwd(),
      "node_modules",
      "allure-commandline",
      "bin",
      "allure",
    );

    try {
      await execFileAsync(
        process.execPath,
        [allureExecutable, "generate", resultsDir, "--clean", "-o", reportDir],
        { cwd: process.cwd(), windowsHide: true, maxBuffer: 10 * 1024 * 1024 },
      );
    } catch (error) {
      const details =
        typeof error === "object" && error !== null && "stderr" in error
          ? String(error.stderr)
          : error instanceof Error
            ? error.message
            : String(error);
      throw new Error(`Allure CLI failed to generate the PostgreSQL report: ${details}`);
    }
  }

  private toTimestamp(value: string | null): number | null {
    if (value == null) {
      return null;
    }

    const timestamp = Number(value);
    return Number.isSafeInteger(timestamp) ? timestamp : null;
  }

  private escapeProperty(value: string): string {
    return value.replace(/\\/g, "\\\\").replace(/([:=#!])/g, "\\$1").replace(/\s/g, "\\ ");
  }
}
