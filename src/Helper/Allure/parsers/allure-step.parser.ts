import { randomUUID } from "node:crypto";

import type { AllureStep } from "../types/allure.types";
import type { ParsedAllureStep } from "../types/parsed.types";

import { AllureAttachmentParser } from "./allure-attachment.parser";
import { AllureParameterParser } from "./allure-parameter.parser";

export class AllureStepParser {
  constructor(
    private readonly attachmentParser: AllureAttachmentParser,
    private readonly parameterParser = new AllureParameterParser(),
  ) {}

  /**
   * Parse nhiều steps.
   */
  async parseMany(
    steps: AllureStep[],
    parentUuid: string | null = null,
  ): Promise<ParsedAllureStep[]> {
    return Promise.all(steps.map((step, index) => this.parse(step, index, parentUuid)));
  }

  /**
   * Parse một step.
   */
  async parse(
    step: AllureStep,
    stepOrder = 0,
    parentUuid: string | null = null,
  ): Promise<ParsedAllureStep> {
    const uuid = step.uuid ?? randomUUID();
    const childSteps = await this.parseMany(step.steps ?? [], uuid);
    const attachments = await this.attachmentParser.parseMany(step.attachments ?? []);
    const parameters = this.parameterParser.parseMany(step.parameters ?? []);
    const duration = this.calculateDuration(step.start, step.stop);

    return {
      ...step,
      uuid,
      steps: childSteps,
      attachments,
      parameters,
      description: step.name,
      stepOrder,
      parentUuid,
      duration,
    };
  }

  /**
   * Tính duration của step.
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
