"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const node_path_1 = __importDefault(require("node:path"));
const Allure_1 = require("../../Helper/Allure");
(0, test_1.test)('inserts parsed Allure results into PostgreSQL', async () => {
    const resultsDir = node_path_1.default.resolve(process.cwd(), 'allure-results');
    const parser = new Allure_1.AllureResultsParser(resultsDir, {
        environment: process.env.NODE_ENV,
        channel: process.env.ALLURE_CHANNEL,
    });
    const results = await parser.parse();
    const run = await parser.parseRun(results);
    const metadata = await new Allure_1.AllureMetadataParser(resultsDir).parse();
    const steps = results.flatMap((result) => result.steps);
    for (let index = 0; index < steps.length; index += 1) {
        steps.push(...steps[index].steps);
    }
    const expectedCounts = {
        steps: steps.length,
        stepParameters: steps.reduce((count, step) => count + step.parameters.length, 0),
        stepAttachments: steps.reduce((count, step) => count + step.attachments.length, 0),
        testParameters: results.reduce((count, result) => count + result.parameters.length, 0),
        labels: results.reduce((count, result) => count + result.labels.length, 0),
        links: results.reduce((count, result) => count + result.links.length, 0),
        testAttachments: results.reduce((count, result) => count + result.attachments.length, 0),
    };
    const pool = (0, Allure_1.createAllurePostgresPool)();
    try {
        const inserted = await new Allure_1.AllurePostgresRepository(pool).insertRun(run, results, metadata);
        const persisted = await pool.query(`SELECT current_database() AS database,
              current_user,
              (SELECT count(*) FROM test_runs WHERE id = $1) AS run_count,
              (SELECT count(*) FROM test_cases WHERE run_id = $1) AS test_count,
              (SELECT count(*) FROM test_steps s
               JOIN test_cases c ON c.id = s.test_id
               WHERE c.run_id = $1) AS step_count,
              (SELECT count(*) FROM step_parameters p
               JOIN test_steps s ON s.id = p.step_id
               JOIN test_cases c ON c.id = s.test_id
               WHERE c.run_id = $1) AS step_parameter_count,
              (SELECT count(*) FROM step_attachments a
               JOIN test_steps s ON s.id = a.step_id
               JOIN test_cases c ON c.id = s.test_id
               WHERE c.run_id = $1) AS step_attachment_count,
              (SELECT count(*) FROM test_parameters p
               JOIN test_cases c ON c.id = p.test_id
               WHERE c.run_id = $1) AS test_parameter_count,
              (SELECT count(*) FROM test_labels l
               JOIN test_cases c ON c.id = l.test_id
               WHERE c.run_id = $1) AS label_count,
              (SELECT count(*) FROM test_links l
               JOIN test_cases c ON c.id = l.test_id
               WHERE c.run_id = $1) AS link_count,
              (SELECT count(*) FROM test_attachments a
               JOIN test_cases c ON c.id = a.test_id
               WHERE c.run_id = $1) AS test_attachment_count,
              (SELECT count(*) FROM test_run_environment WHERE run_id = $1) AS environment_count,
              (SELECT count(*) FROM test_run_categories WHERE run_id = $1) AS category_count,
              (SELECT count(*) FROM test_run_executor WHERE run_id = $1) AS executor_count,
              (SELECT count(*) FROM test_run_history WHERE run_id = $1) AS history_file_count`, [inserted.runId]);
        (0, test_1.expect)(persisted.rows).toHaveLength(1);
        (0, test_1.expect)(persisted.rows[0].run_count).toBe('1');
        (0, test_1.expect)(Number(persisted.rows[0].test_count)).toBe(results.length);
        (0, test_1.expect)(Number(persisted.rows[0].step_count)).toBe(expectedCounts.steps);
        (0, test_1.expect)(Number(persisted.rows[0].step_parameter_count)).toBe(expectedCounts.stepParameters);
        (0, test_1.expect)(Number(persisted.rows[0].step_attachment_count)).toBe(expectedCounts.stepAttachments);
        (0, test_1.expect)(Number(persisted.rows[0].test_parameter_count)).toBe(expectedCounts.testParameters);
        (0, test_1.expect)(Number(persisted.rows[0].label_count)).toBe(expectedCounts.labels);
        (0, test_1.expect)(Number(persisted.rows[0].link_count)).toBe(expectedCounts.links);
        (0, test_1.expect)(Number(persisted.rows[0].test_attachment_count)).toBe(expectedCounts.testAttachments);
        (0, test_1.expect)(Number(persisted.rows[0].environment_count)).toBe(Object.keys(metadata.environment).length);
        (0, test_1.expect)(Number(persisted.rows[0].category_count)).toBe(metadata.categories.length);
        (0, test_1.expect)(Number(persisted.rows[0].executor_count)).toBe(metadata.executor ? 1 : 0);
        (0, test_1.expect)(Number(persisted.rows[0].history_file_count)).toBe(Object.keys(metadata.history).length);
        (0, test_1.expect)(inserted.testCount).toBe(results.length);
        console.log('[Allure PostgreSQL] Imported:', {
            ...persisted.rows[0],
            runId: inserted.runId,
            testCount: inserted.testCount,
            parsedCounts: expectedCounts,
            metadataCounts: {
                environment: Object.keys(metadata.environment).length,
                categories: metadata.categories.length,
                executor: metadata.executor ? 1 : 0,
                historyFiles: Object.keys(metadata.history).length,
            },
        });
    }
    finally {
        await pool.end();
    }
});
