import { readFile } from "node:fs/promises";
import path from "node:path";

import type { AllureAttachment } from "../types/allure.types";
import type { ParsedAllureAttachment } from "../types/parsed.types";

export interface AllureAttachmentParserOptions {
  /**
   * Nếu true:
   *
   * attachment được reference nhưng không tồn tại
   * => throw error.
   *
   * Default: false
   */
  strict?: boolean;
}

export class AllureAttachmentParser {
  constructor(
    private readonly resultsDir: string,
    private readonly options: AllureAttachmentParserOptions = {},
  ) {}

  /**
   * Parse một attachment.
   */
  async parse(attachment: AllureAttachment): Promise<ParsedAllureAttachment> {
    const attachmentPath = path.resolve(this.resultsDir, attachment.source);
    let data: Buffer | null;

    try {
      data = await readFile(attachmentPath);
    } catch (error) {
      const isMissing =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "ENOENT";

      if (!isMissing) {
        throw new Error(
          `Cannot read Allure attachment "${attachmentPath}": ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }

      if (this.options.strict) {
        throw new Error(`Allure attachment not found: ${attachmentPath}`);
      }

      data = null;
    }

    const exists = data !== null;

    return {
      ...attachment,
      path: attachmentPath,
      exists,
      data,
    };
  }

  /**
   * Parse nhiều attachment.
   */
  async parseMany(attachments: AllureAttachment[]): Promise<ParsedAllureAttachment[]> {
    return Promise.all(attachments.map((attachment) => this.parse(attachment)));
  }
}
