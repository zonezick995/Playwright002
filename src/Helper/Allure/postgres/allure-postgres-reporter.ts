import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { FullConfig, FullResult, Reporter } from "@playwright/test/reporter";

import { AllureResultsParser } from "../allure-results.parser";
import { AllureMetadataParser } from "../parsers/allure-metadata.parser";
import { createAllurePostgresPool } from "./allure-postgres.pool";
import { AllurePostgresRepository } from "./allure-postgres.repository";

interface AllurePostgresReporterOptions {
  resultsDir?: string;
  executor?: Record<string, string | number | undefined>;
}

export default class AllurePostgresReporter implements Reporter {
  private readonly resultsDir: string;
  private readonly executor: Record<string, string | number | undefined> | undefined;
  private filesBeforeRun = new Set<string>();

  constructor(options: AllurePostgresReporterOptions = {}) {
    this.resultsDir = path.resolve(
      process.cwd(),
      options.resultsDir ?? "allure-results",
    );
    this.executor = options.executor;
  }

  async onBegin(_config: FullConfig): Promise<void> {
    try {
      await mkdir(this.resultsDir, { recursive: true });
      if (this.executor) {
        const executor = Object.fromEntries(
          Object.entries(this.executor).filter(([, value]) => value !== undefined),
        );
        await writeFile(
          path.join(this.resultsDir, "executor.json"),
          `${JSON.stringify(executor, null, 2)}\n`,
          "utf8",
        );
      }
      this.filesBeforeRun = new Set(await readdir(this.resultsDir));
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        this.filesBeforeRun.clear();
        return;
      }
      throw error;
    }
  }

  async onEnd(_result: FullResult): Promise<void> {
    const resultFiles = (await readdir(this.resultsDir))
      .filter(
        (file) =>
          file.endsWith("-result.json") && !this.filesBeforeRun.has(file),
      )
      .sort();

    if (resultFiles.length === 0) {
      console.log(
        "[Allure PostgreSQL] No new Allure result files; skipping database insert.",
      );
      return;
    }

    const parser = new AllureResultsParser(this.resultsDir, {
      environment: process.env.NODE_ENV,
      channel: process.env.ALLURE_CHANNEL,
    });
    const results = await parser.parse(resultFiles);
    const run = await parser.parseRun(results);
    const metadata = await new AllureMetadataParser(this.resultsDir).parse();
    const pool = createAllurePostgresPool();

    try {
      const inserted = await new AllurePostgresRepository(pool).insertRun(
        run,
        results,
        metadata,
      );
      console.log("[Allure PostgreSQL] Automatically imported completed run:", {
        runId: inserted.runId,
        testCount: inserted.testCount,
        metadata: {
          environmentProperties: Object.keys(metadata.environment).length,
          categories: metadata.categories.length,
          executor: Boolean(metadata.executor),
          historyFiles: Object.keys(metadata.history).length,
        },
      });
    } finally {
      await pool.end();
    }
  }
}
