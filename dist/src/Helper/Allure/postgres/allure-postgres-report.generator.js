"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllurePostgresReportGenerator = void 0;
const node_child_process_1 = require("node:child_process");
const node_util_1 = require("node:util");
const promises_1 = require("node:fs/promises");
const node_path_1 = __importDefault(require("node:path"));
const execFileAsync = (0, node_util_1.promisify)(node_child_process_1.execFile);
class AllurePostgresReportGenerator {
    constructor(repository, outputRoot = node_path_1.default.resolve(process.cwd(), "allure-db-reports")) {
        this.repository = repository;
        this.outputRoot = outputRoot;
    }
    async generate(runId) {
        const report = await this.repository.readReport(runId);
        if (!report) {
            throw new Error(runId === undefined
                ? "No Allure runs were found in PostgreSQL."
                : `Allure run ${runId} was not found in PostgreSQL.`);
        }
        const resultsDir = node_path_1.default.join(this.outputRoot, `allure-results-${report.id}`);
        const reportDir = node_path_1.default.join(this.outputRoot, `allure-report-${report.id}`);
        await (0, promises_1.rm)(resultsDir, { recursive: true, force: true });
        await (0, promises_1.rm)(reportDir, { recursive: true, force: true });
        await (0, promises_1.mkdir)(resultsDir, { recursive: true });
        for (const test of report.tests) {
            const resultJson = await this.toAllureResult(test, resultsDir);
            await (0, promises_1.writeFile)(node_path_1.default.join(resultsDir, `${test.uuid}-result.json`), JSON.stringify(resultJson), "utf8");
        }
        const environment = {
            ...report.environmentProperties,
            ...(report.environment ? { Environment: report.environment } : {}),
            ...(report.channel ? { Channel: report.channel } : {}),
        };
        if (Object.keys(environment).length > 0) {
            await (0, promises_1.writeFile)(node_path_1.default.join(resultsDir, "environment.properties"), `${Object.entries(environment)
                .map(([key, value]) => `${this.escapeProperty(key)}=${this.escapeProperty(value)}`)
                .join("\n")}\n`, "utf8");
        }
        if (report.categories.length > 0) {
            await (0, promises_1.writeFile)(node_path_1.default.join(resultsDir, "categories.json"), JSON.stringify(report.categories), "utf8");
        }
        if (report.executor) {
            await (0, promises_1.writeFile)(node_path_1.default.join(resultsDir, "executor.json"), JSON.stringify(report.executor), "utf8");
        }
        const historyDir = node_path_1.default.join(resultsDir, "history");
        const historyEntries = Object.entries(report.history);
        if (historyEntries.length > 0) {
            await (0, promises_1.mkdir)(historyDir, { recursive: true });
            for (const [fileName, data] of historyEntries) {
                if (node_path_1.default.basename(fileName) !== fileName || !fileName.endsWith(".json")) {
                    throw new Error(`Invalid Allure history file name stored in database: ${fileName}`);
                }
                await (0, promises_1.writeFile)(node_path_1.default.join(historyDir, fileName), JSON.stringify(data), "utf8");
            }
        }
        await this.runAllureGenerate(resultsDir, reportDir);
        return {
            runId: report.id,
            resultsDir,
            reportDir,
            filePath: node_path_1.default.join(reportDir, "index.html"),
            testCount: report.tests.length,
        };
    }
    async toAllureResult(test, resultsDir) {
        const [attachments, steps] = await Promise.all([
            this.writeAttachments(test.attachments, resultsDir),
            this.toAllureSteps(test.steps, resultsDir),
        ]);
        return {
            uuid: test.uuid,
            historyId: test.historyId,
            testCaseId: test.id.toString(),
            name: test.name,
            fullName: test.fullName,
            titlePath: test.titlePath,
            status: test.status ?? "unknown",
            statusDetails: test.statusDetails,
            stage: test.stage ?? "finished",
            start: this.toTimestamp(test.start),
            stop: this.toTimestamp(test.stop),
            parameters: test.parameters.map((parameter) => ({
                name: parameter.name,
                value: parameter.value,
                excluded: parameter.exclude,
                mode: parameter.mode,
            })),
            labels: test.labels,
            links: test.links
                .filter((link) => link.url != null)
                .map((link) => ({
                name: link.name,
                type: link.type,
                url: link.url,
            })),
            attachments,
            steps,
        };
    }
    async toAllureSteps(steps, resultsDir) {
        return Promise.all(steps.map(async (step) => ({
            name: step.description,
            uuid: step.uuid,
            status: step.status,
            statusDetails: step.statusDetails,
            stage: step.stage,
            start: this.toTimestamp(step.start),
            stop: this.toTimestamp(step.stop),
            parameters: step.parameters.map((parameter) => ({
                name: parameter.name,
                value: parameter.value,
                excluded: parameter.exclude,
                mode: parameter.mode,
            })),
            attachments: await this.writeAttachments(step.attachments, resultsDir),
            steps: await this.toAllureSteps(step.steps, resultsDir),
        })));
    }
    async writeAttachments(attachments, resultsDir) {
        return Promise.all(attachments.map(async (attachment) => {
            if (!attachment.data) {
                throw new Error(`Cannot generate Allure report: attachment "${attachment.name}" ` +
                    `(database id ${attachment.id}) has no stored data.`);
            }
            const extension = node_path_1.default.extname(attachment.name).replace(/[^.a-zA-Z0-9_-]/g, "");
            const source = `attachment-${attachment.id}${extension}`;
            await (0, promises_1.writeFile)(node_path_1.default.join(resultsDir, source), attachment.data);
            return {
                name: attachment.name,
                type: attachment.type,
                source,
            };
        }));
    }
    async runAllureGenerate(resultsDir, reportDir) {
        const allureExecutable = node_path_1.default.resolve(process.cwd(), "node_modules", "allure-commandline", "bin", "allure");
        try {
            await execFileAsync(process.execPath, [allureExecutable, "generate", resultsDir, "--clean", "-o", reportDir], { cwd: process.cwd(), windowsHide: true, maxBuffer: 10 * 1024 * 1024 });
        }
        catch (error) {
            const details = typeof error === "object" && error !== null && "stderr" in error
                ? String(error.stderr)
                : error instanceof Error
                    ? error.message
                    : String(error);
            throw new Error(`Allure CLI failed to generate the PostgreSQL report: ${details}`);
        }
    }
    toTimestamp(value) {
        if (value == null) {
            return null;
        }
        const timestamp = Number(value);
        return Number.isSafeInteger(timestamp) ? timestamp : null;
    }
    escapeProperty(value) {
        return value.replace(/\\/g, "\\\\").replace(/([:=#!])/g, "\\$1").replace(/\s/g, "\\ ");
    }
}
exports.AllurePostgresReportGenerator = AllurePostgresReportGenerator;
