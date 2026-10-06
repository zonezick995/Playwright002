"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const promises_1 = require("node:fs/promises");
const node_os_1 = __importDefault(require("node:os"));
const node_path_1 = __importDefault(require("node:path"));
const Allure_1 = require("../../Helper/Allure");
(0, test_1.test)('persists Allure run metadata and restores it for report generation', async () => {
    const tempRoot = await (0, promises_1.mkdtemp)(node_path_1.default.join(node_os_1.default.tmpdir(), 'allure-postgres-metadata-'));
    const resultsDir = node_path_1.default.join(tempRoot, 'allure-results');
    const outputDir = node_path_1.default.join(tempRoot, 'reports');
    const testUuid = '5db56316-8b21-4c07-a7cc-3d33a7baecf8';
    const pool = (0, Allure_1.createAllurePostgresPool)();
    try {
        await (0, promises_1.mkdir)(node_path_1.default.join(resultsDir, 'history'), { recursive: true });
        await Promise.all([
            (0, promises_1.writeFile)(node_path_1.default.join(resultsDir, `${testUuid}-result.json`), JSON.stringify({
                uuid: testUuid,
                name: 'metadata database integration',
                status: 'passed',
                stage: 'finished',
                start: 1700000000000,
                stop: 1700000000100,
                labels: [],
                parameters: [],
                steps: [],
                attachments: [],
                links: [],
            })),
            (0, promises_1.writeFile)(node_path_1.default.join(resultsDir, 'environment.properties'), 'Browser=chromium\n'),
            (0, promises_1.writeFile)(node_path_1.default.join(resultsDir, 'categories.json'), JSON.stringify([{ name: 'Product defects', matchedStatuses: ['failed'] }])),
            (0, promises_1.writeFile)(node_path_1.default.join(resultsDir, 'executor.json'), JSON.stringify({ name: 'Local CI', type: 'local', buildOrder: 19 })),
            (0, promises_1.writeFile)(node_path_1.default.join(resultsDir, 'history', 'history-trend.json'), JSON.stringify([{ buildOrder: 18, data: { passed: 2, failed: 1 } }])),
        ]);
        const resultsParser = new Allure_1.AllureResultsParser(resultsDir);
        const results = await resultsParser.parse();
        const run = await resultsParser.parseRun(results);
        const metadata = await new Allure_1.AllureMetadataParser(resultsDir).parse();
        const repository = new Allure_1.AllurePostgresRepository(pool);
        const inserted = await repository.insertRun(run, results, metadata);
        const stored = await repository.readReport(inserted.runId);
        (0, test_1.expect)(stored).not.toBeNull();
        (0, test_1.expect)(stored?.environmentProperties).toEqual({ Browser: 'chromium' });
        (0, test_1.expect)(stored?.categories).toEqual([
            { name: 'Product defects', matchedStatuses: ['failed'] },
        ]);
        (0, test_1.expect)(stored?.executor).toEqual({ name: 'Local CI', type: 'local', buildOrder: 19 });
        (0, test_1.expect)(stored?.history['history-trend.json']).toEqual([
            { buildOrder: 18, data: { passed: 2, failed: 1 } },
        ]);
        const generated = await new Allure_1.AllurePostgresReportGenerator(repository, outputDir).generate(inserted.runId);
        (0, test_1.expect)(await (0, promises_1.readFile)(node_path_1.default.join(generated.resultsDir, 'environment.properties'), 'utf8'))
            .toContain('Browser=chromium');
        (0, test_1.expect)(JSON.parse(await (0, promises_1.readFile)(node_path_1.default.join(generated.resultsDir, 'categories.json'), 'utf8')))
            .toEqual(metadata.categories);
        (0, test_1.expect)(JSON.parse(await (0, promises_1.readFile)(node_path_1.default.join(generated.resultsDir, 'executor.json'), 'utf8')))
            .toEqual(metadata.executor);
        (0, test_1.expect)(JSON.parse(await (0, promises_1.readFile)(node_path_1.default.join(generated.resultsDir, 'history', 'history-trend.json'), 'utf8'))).toEqual(metadata.history['history-trend.json']);
        (0, test_1.expect)(await (0, promises_1.readFile)(generated.filePath, 'utf8')).toContain('<html');
    }
    finally {
        await pool.end();
        await (0, promises_1.rm)(tempRoot, { recursive: true, force: true });
    }
});
