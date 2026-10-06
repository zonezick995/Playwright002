"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const promises_1 = require("node:fs/promises");
const Allure_1 = require("../../Helper/Allure");
(0, test_1.test)('generates an HTML report from the latest PostgreSQL Allure run', async () => {
    const configuredRunId = process.env.ALLURE_RUN_ID?.trim();
    const runId = configuredRunId ? Number(configuredRunId) : undefined;
    if (runId !== undefined && (!Number.isSafeInteger(runId) || runId < 1)) {
        throw new Error('ALLURE_RUN_ID must be a positive integer.');
    }
    const pool = (0, Allure_1.createAllurePostgresPool)();
    try {
        const repository = new Allure_1.AllurePostgresRepository(pool);
        const run = await repository.readReport(runId);
        if (!run) {
            throw new Error(runId
                ? `Allure run ${runId} should exist in PostgreSQL.`
                : 'No Allure run was found in PostgreSQL.');
        }
        const generated = await new Allure_1.AllurePostgresReportGenerator(repository).generate(runId);
        await (0, promises_1.access)(generated.filePath);
        const resultFiles = (await (0, promises_1.readdir)(generated.resultsDir))
            .filter((file) => file.endsWith('-result.json'));
        (0, test_1.expect)(generated.runId).toBe(run.id);
        (0, test_1.expect)(generated.testCount).toBe(run.tests.length);
        (0, test_1.expect)(resultFiles).toHaveLength(run.tests.length);
        (0, test_1.expect)(await (0, promises_1.readFile)(generated.filePath, 'utf8')).toContain('<html');
        console.log('[Allure PostgreSQL Report] Generated:', {
            runId: generated.runId,
            testCount: generated.testCount,
            reportDir: generated.reportDir,
            filePath: generated.filePath,
        });
    }
    finally {
        await pool.end();
    }
});
