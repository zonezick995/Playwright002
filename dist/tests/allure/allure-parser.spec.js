"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const node_path_1 = __importDefault(require("node:path"));
const Allure_1 = require("../../Helper/Allure");
(0, test_1.test)('prints parsed Allure values for database inspection', async () => {
    const resultsDir = node_path_1.default.resolve(process.cwd(), 'allure-results');
    const parser = new Allure_1.AllureResultsParser(resultsDir, {
        environment: process.env.NODE_ENV,
        channel: process.env.ALLURE_CHANNEL,
    });
    const results = await parser.parse();
    const run = await parser.parseRun(results);
    console.log(`[Allure Parser] Parsed ${results.length} result file(s).`);
    console.log('[Allure Parser] test_runs values:', JSON.stringify(run, null, 2));
    console.log('[Allure Parser] Per-test and child-table values:', JSON.stringify(results, (key, value) => {
        if (key === 'data' &&
            typeof value === 'object' &&
            value !== null &&
            'type' in value &&
            value.type === 'Buffer' &&
            'data' in value &&
            Array.isArray(value.data)) {
            return `<Buffer ${value.data.length} bytes>`;
        }
        return value;
    }, 2));
    (0, test_1.expect)(run.totalTest).toBe(results.length);
    (0, test_1.expect)(run.passed + run.failed + run.broken + run.skipped + run.unknown).toBe(results.length);
});
