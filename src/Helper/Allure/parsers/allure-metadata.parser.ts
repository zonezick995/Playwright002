import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

export interface AllureCategory {
  name: string;
  matchedStatuses?: string[];
  messageRegex?: string;
  traceRegex?: string;
  flaky?: boolean;
  [key: string]: unknown;
}

export interface ParsedAllureMetadata {
  environment: Record<string, string>;
  categories: AllureCategory[];
  executor: Record<string, unknown> | null;
  history: Record<string, unknown>;
}

export class AllureMetadataParser {
  constructor(private readonly resultsDir: string) {}

  async parse(): Promise<ParsedAllureMetadata> {
    const [environment, categories, executor, history] = await Promise.all([
      this.parseEnvironment(),
      this.parseCategories(),
      this.parseExecutor(),
      this.parseHistory(),
    ]);

    return { environment, categories, executor, history };
  }

  private async parseEnvironment(): Promise<Record<string, string>> {
    const filePath = path.join(this.resultsDir, "environment.properties");
    const content = await this.readOptionalText(filePath);
    const properties: Record<string, string> = {};

    for (const line of content?.split(/\r?\n/) ?? []) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("!")) {
        continue;
      }

      const separator = trimmed.search(/(?<!\\)[=:]/);
      if (separator < 0) {
        properties[this.unescapeProperty(trimmed)] = "";
        continue;
      }

      const key = this.unescapeProperty(trimmed.slice(0, separator).trim());
      const value = this.unescapeProperty(trimmed.slice(separator + 1).trim());
      if (key) {
        properties[key] = value;
      }
    }

    return properties;
  }

  private async parseCategories(): Promise<AllureCategory[]> {
    const value = await this.readOptionalJson(path.join(this.resultsDir, "categories.json"));
    if (value == null) {
      return [];
    }
    if (!Array.isArray(value)) {
      throw new Error("Allure categories.json must contain a JSON array.");
    }

    return value.map((category, index) => {
      if (
        typeof category !== "object" ||
        category === null ||
        Array.isArray(category) ||
        typeof category.name !== "string" ||
        category.name.length === 0
      ) {
        throw new Error(`Allure categories.json item ${index} must have a non-empty name.`);
      }
      return category as AllureCategory;
    });
  }

  private async parseExecutor(): Promise<Record<string, unknown> | null> {
    const value = await this.readOptionalJson(path.join(this.resultsDir, "executor.json"));
    if (value == null) {
      return null;
    }
    if (typeof value !== "object" || Array.isArray(value)) {
      throw new Error("Allure executor.json must contain a JSON object.");
    }
    return value as Record<string, unknown>;
  }

  private async parseHistory(): Promise<Record<string, unknown>> {
    const historyDir = path.join(this.resultsDir, "history");
    let files: string[];
    try {
      files = await readdir(historyDir);
    } catch (error) {
      if (this.isMissing(error)) {
        return {};
      }
      throw error;
    }

    const entries = await Promise.all(
      files
        .filter((file) => file.endsWith(".json") && path.basename(file) === file)
        .map(async (file) => {
          const value = await this.readRequiredJson(path.join(historyDir, file));
          return [file, value] as const;
        }),
    );

    return Object.fromEntries(entries);
  }

  private async readOptionalJson(filePath: string): Promise<unknown | null> {
    const content = await this.readOptionalText(filePath);
    if (content == null) {
      return null;
    }
    try {
      return JSON.parse(content) as unknown;
    } catch (error) {
      throw new Error(
        `Invalid Allure metadata JSON "${filePath}": ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async readRequiredJson(filePath: string): Promise<unknown> {
    const content = await this.readOptionalText(filePath);
    if (content == null) {
      throw new Error(`Allure history file disappeared while parsing: ${filePath}`);
    }
    try {
      return JSON.parse(content) as unknown;
    } catch (error) {
      throw new Error(
        `Invalid Allure history JSON "${filePath}": ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async readOptionalText(filePath: string): Promise<string | null> {
    try {
      return await readFile(filePath, "utf8");
    } catch (error) {
      if (this.isMissing(error)) {
        return null;
      }
      throw new Error(
        `Cannot read Allure metadata "${filePath}": ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private isMissing(error: unknown): boolean {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ENOENT"
    );
  }

  private unescapeProperty(value: string): string {
    return value.replace(/\\([\\:=#! ])/g, "$1");
  }
}
