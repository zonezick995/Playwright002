import { readFile } from "node:fs/promises";
import path from "node:path";

import type { AllureResult } from "../types/allure.types";
import type { ParsedAllureResult } from "../types/parsed.types";

import { AllureAttachmentParser } from "./allure-attachment.parser";
import { AllureLabelParser } from "./allure-label.parser";
import { AllureLinkParser } from "./allure-link.parser";
import { AllureParameterParser } from "./allure-parameter.parser";
import { AllureStepParser } from "./allure-step.parser";

export class AllureResultParser {
  constructor(
    private readonly resultsDir: string,
    private readonly stepParser: AllureStepParser,
    private readonly attachmentParser: AllureAttachmentParser,
    private readonly parameterParser = new AllureParameterParser(),
    private readonly labelParser = new AllureLabelParser(),
    private readonly linkParser = new AllureLinkParser(),
  ) {}

  /**
   * Parse một file:
   *
   *     abc-result.json
   */
  async parse(fileName: string): Promise<ParsedAllureResult> {
    const filePath = path.resolve(this.resultsDir, fileName);
    const result = await this.readJson(filePath);

    this.validate(result, fileName);

    const steps = await this.stepParser.parseMany(result.steps ?? []);
    const attachments = await this.attachmentParser.parseMany(result.attachments ?? []);
    const parameters = this.parameterParser.parseMany(result.parameters ?? []);
    const labels = this.labelParser.parseMany(result.labels ?? []);
    const links = this.linkParser.parseMany(result.links ?? []);
    const duration = this.calculateDuration(result.start, result.stop);

    return {
      ...result,
      resultFile: fileName,
      resultFilePath: filePath,
      duration,
      steps,
      attachments,
      parameters,
      labels,
      links,
    };
  }

  /**
   * Đọc JSON.
   */
  private async readJson(filePath: string): Promise<AllureResult> {
    let content: string;

    try {
      content = await readFile(filePath, "utf8");
    } catch (error) {
      throw new Error(
        `Cannot read Allure result "${filePath}": ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    try {
      return JSON.parse(content) as AllureResult;
    } catch (error) {
      throw new Error(
        `Invalid JSON "${filePath}": ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Validate result.
   */
  private validate(result: AllureResult, fileName: string): void {
    if (!result.uuid) {
      throw new Error(`Allure result "${fileName}" has no uuid`);
    }

    if (!result.name) {
      throw new Error(`Allure result "${fileName}" has no name`);
    }

    if (result.start != null && result.stop != null && result.stop < result.start) {
      throw new Error(`Allure result "${fileName}" has stop < start`);
    }
  }

  /**
   * Calculate duration.
   */
  private calculateDuration(start?: number | null, stop?: number | null): number | undefined {
    if (start == null || stop == null) {
      return undefined;
    }

    if (stop < start) {
      return undefined;
    }

    return stop - start;
  }
}
