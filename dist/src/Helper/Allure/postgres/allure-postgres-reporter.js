"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = require("node:fs/promises");
const node_path_1 = __importDefault(require("node:path"));
const allure_results_parser_1 = require("../allure-results.parser");
const allure_metadata_parser_1 = require("../parsers/allure-metadata.parser");
const allure_postgres_pool_1 = require("./allure-postgres.pool");
const allure_postgres_repository_1 = require("./allure-postgres.repository");
class AllurePostgresReporter {
    constructor(options = {}) {
        this.filesBeforeRun = new Set();
        this.resultsDir = node_path_1.default.resolve(process.cwd(), options.resultsDir ?? "allure-results");
        this.executor = options.executor;
    }
    async onBegin(_config) {
        try {
            await (0, promises_1.mkdir)(this.resultsDir, { recursive: true });
            if (this.executor) {
                const executor = Object.fromEntries(Object.entries(this.executor).filter(([, value]) => value !== undefined));
                await (0, promises_1.writeFile)(node_path_1.default.join(this.resultsDir, "executor.json"), `${JSON.stringify(executor, null, 2)}\n`, "utf8");
            }
            this.filesBeforeRun = new Set(await (0, promises_1.readdir)(this.resultsDir));
        }
        catch (error) {
            if (typeof error === "object" &&
                error !== null &&
                "code" in error &&
                error.code === "ENOENT") {
                this.filesBeforeRun.clear();
                return;
            }
            throw error;
        }
    }
    async onEnd(_result) {
        const resultFiles = (await (0, promises_1.readdir)(this.resultsDir))
            .filter((file) => file.endsWith("-result.json") && !this.filesBeforeRun.has(file))
            .sort();
        if (resultFiles.length === 0) {
            console.log("[Allure PostgreSQL] No new Allure result files; skipping database insert.");
            return;
        }
        const parser = new allure_results_parser_1.AllureResultsParser(this.resultsDir, {
            environment: process.env.NODE_ENV,
            channel: process.env.ALLURE_CHANNEL,
        });
        const results = await parser.parse(resultFiles);
        const run = await parser.parseRun(results);
        const metadata = await new allure_metadata_parser_1.AllureMetadataParser(this.resultsDir).parse();
        const pool = (0, allure_postgres_pool_1.createAllurePostgresPool)();
        try {
            const inserted = await new allure_postgres_repository_1.AllurePostgresRepository(pool).insertRun(run, results, metadata);
            console.log("[Allure PostgreSQL] Automatically imported completed run:", {
                runId: inserted.runId,
                testCount: inserted.testCount,
                metadata: {
                    environmentProperties: Object.keys(metadata.environment).length,
                    categories: metadata.categories.length,
                    executor: Boolean(metadata.executor),
                    historyFiles: Object.keys(metadata.history).length,
                },
            });
        }
        finally {
            await pool.end();
        }
    }
}
exports.default = AllurePostgresReporter;
