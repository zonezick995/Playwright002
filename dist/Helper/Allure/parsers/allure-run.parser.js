"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllureRunParser = void 0;
class AllureRunParser {
    constructor(options = {}) {
        this.options = options;
    }
    parse(results) {
        const counts = {
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
            .filter((value) => typeof value === "number");
        const stops = results
            .map((result) => result.stop)
            .filter((value) => typeof value === "number");
        const runDate = starts.length > 0 ? Math.min(...starts) : null;
        const duration = starts.length > 0 && stops.length > 0
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
exports.AllureRunParser = AllureRunParser;
