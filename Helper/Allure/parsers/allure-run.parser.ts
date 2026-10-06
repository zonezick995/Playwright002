import type { ParsedAllureResult, ParsedAllureRun } from "../types/parsed.types";

export interface AllureRunParserOptions {
  environment?: string;
  channel?: string;
}

export class AllureRunParser {
  constructor(private readonly options: AllureRunParserOptions = {}) {}

  parse(results: ParsedAllureResult[]): ParsedAllureRun {
    const counts: Omit<ParsedAllureRun, "environment" | "channel" | "runDate" | "duration" | "totalTest"> = {
      passed: 0,
      failed: 0,
      broken: 0,
      skipped: 0,
      unknown: 0,
    };

    for (const result of results) {
      const status = result.status?.toLowerCase();
      switch (status) {
        case "passed":
          counts.passed += 1;
          break;
        case "failed":
          counts.failed += 1;
          break;
        case "broken":
          counts.broken += 1;
          break;
        case "skipped":
          counts.skipped += 1;
          break;
        default:
          counts.unknown += 1;
      }
    }

    const starts = results
      .map((result) => result.start)
      .filter((value): value is number => typeof value === "number");
    const stops = results
      .map((result) => result.stop)
      .filter((value): value is number => typeof value === "number");
    const runDate = starts.length > 0 ? Math.min(...starts) : null;
    const duration =
      starts.length > 0 && stops.length > 0
        ? Math.max(...stops) - Math.min(...starts)
        : null;

    return {
      environment: this.options.environment ?? null,
      channel: this.options.channel ?? null,
      runDate,
      totalTest: results.length,
      ...counts,
      duration: duration != null && duration >= 0 ? duration : null,
    };
  }
}
