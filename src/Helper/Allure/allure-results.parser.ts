import { readdir, stat } from "node:fs/promises";
import path from "node:path";

import type { ParsedAllureResult, ParsedAllureRun } from "./types/parsed.types";

import { AllureAttachmentParser } from "./parsers/allure-attachment.parser";
import { AllureResultParser } from "./parsers/allure-result.parser";
import { AllureRunParser } from "./parsers/allure-run.parser";
import { AllureStepParser } from "./parsers/allure-step.parser";

export interface AllureResultsParserOptions {
  /**
   * Nếu true, attachment bị thiếu sẽ làm parser throw error.
   */
  strictAttachments?: boolean;
  environment?: string;
  channel?: string;
}

export class AllureResultsParser {
  private readonly resultParser: AllureResultParser;
  private readonly runParser: AllureRunParser;

  constructor(
    private readonly resultsDir: string,
    private readonly options: AllureResultsParserOptions = {},
  ) {
    const attachmentParser = new AllureAttachmentParser(resultsDir, {
      strict: this.options.strictAttachments ?? false,
    });
    const stepParser = new AllureStepParser(attachmentParser);

    this.resultParser = new AllureResultParser(resultsDir, stepParser, attachmentParser);
    this.runParser = new AllureRunParser({
      environment: this.options.environment,
      channel: this.options.channel,
    });
  }

  /**
   * Parse toàn bộ folder.
   */
  async parse(fileNames?: string[]): Promise<ParsedAllureResult[]> {
    await this.assertDirectory();

    const entries = fileNames ?? (await readdir(this.resultsDir));
    const resultFiles = (
      await Promise.all(
        entries.map(async (file) => {
          if (
            path.basename(file) !== file ||
            !file.endsWith("-result.json")
          ) {
            if (fileNames) {
              throw new Error(`Invalid Allure result file name: ${file}`);
            }
            return null;
          }

          const filePath = path.join(this.resultsDir, file);
          const info = await stat(filePath);
          return info.isFile() ? file : null;
        }),
      )
    ).filter((file): file is string => file !== null);

    const results = await Promise.all(
      resultFiles.map((file) => this.resultParser.parse(file)),
    );

    results.sort((a, b) => {
      const aStart = typeof a.start === "number" ? a.start : Number.MAX_SAFE_INTEGER;
      const bStart = typeof b.start === "number" ? b.start : Number.MAX_SAFE_INTEGER;

      return aStart - bStart;
    });

    return results;
  }

  /**
   * Parse aggregate values for the test_runs database row.
   */
  async parseRun(results?: ParsedAllureResult[]): Promise<ParsedAllureRun> {
    const parsedResults = results ?? (await this.parse());
    return this.runParser.parse(parsedResults);
  }

  /**
   * Validate directory.
   */
  private async assertDirectory(): Promise<void> {
    let info: Awaited<ReturnType<typeof stat>>;

    try {
      info = await stat(this.resultsDir);
    } catch {
      throw new Error(`Allure results directory does not exist: ${this.resultsDir}`);
    }

    if (!info.isDirectory()) {
      throw new Error(`Allure results path is not a directory: ${this.resultsDir}`);
    }
  }
}
