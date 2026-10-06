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
(0, test_1.test)('parses Allure environment, categories, executor, and history artifacts', async () => {
    const resultsDir = await (0, promises_1.mkdtemp)(node_path_1.default.join(node_os_1.default.tmpdir(), 'allure-metadata-'));
    try {
        await (0, promises_1.mkdir)(node_path_1.default.join(resultsDir, 'history'));
        await Promise.all([
            (0, promises_1.writeFile)(node_path_1.default.join(resultsDir, 'environment.properties'), '# run environment\nBrowser=chromium\nBuild\\ Number=42\n'),
            (0, promises_1.writeFile)(node_path_1.default.join(resultsDir, 'categories.json'), JSON.stringify([{ name: 'Product defects', matchedStatuses: ['failed'] }])),
            (0, promises_1.writeFile)(node_path_1.default.join(resultsDir, 'executor.json'), JSON.stringify({ name: 'CI', type: 'jenkins', buildOrder: 42 })),
            (0, promises_1.writeFile)(node_path_1.default.join(resultsDir, 'history', 'history-trend.json'), JSON.stringify([{ buildOrder: 41, data: { passed: 3, failed: 1 } }])),
        ]);
        const metadata = await new Allure_1.AllureMetadataParser(resultsDir).parse();
        (0, test_1.expect)(metadata.environment).toEqual({
            Browser: 'chromium',
            'Build Number': '42',
        });
        (0, test_1.expect)(metadata.categories).toEqual([
            { name: 'Product defects', matchedStatuses: ['failed'] },
        ]);
        (0, test_1.expect)(metadata.executor).toEqual({ name: 'CI', type: 'jenkins', buildOrder: 42 });
        (0, test_1.expect)(metadata.history['history-trend.json']).toEqual([
            { buildOrder: 41, data: { passed: 3, failed: 1 } },
        ]);
    }
    finally {
        await (0, promises_1.rm)(resultsDir, { recursive: true, force: true });
    }
});
