"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllureResultsParser = void 0;
const promises_1 = require("node:fs/promises");
const node_path_1 = __importDefault(require("node:path"));
const allure_attachment_parser_1 = require("./parsers/allure-attachment.parser");
const allure_result_parser_1 = require("./parsers/allure-result.parser");
const allure_run_parser_1 = require("./parsers/allure-run.parser");
const allure_step_parser_1 = require("./parsers/allure-step.parser");
class AllureResultsParser {
    constructor(resultsDir, options = {}) {
        this.resultsDir = resultsDir;
        this.options = options;
        const attachmentParser = new allure_attachment_parser_1.AllureAttachmentParser(resultsDir, {
            strict: this.options.strictAttachments ?? false,
        });
        const stepParser = new allure_step_parser_1.AllureStepParser(attachmentParser);
        this.resultParser = new allure_result_parser_1.AllureResultParser(resultsDir, stepParser, attachmentParser);
        this.runParser = new allure_run_parser_1.AllureRunParser({
            environment: this.options.environment,
            channel: this.options.channel,
        });
    }
    /**
     * Parse toàn bộ folder.
     */
    async parse(fileNames) {
        await this.assertDirectory();
        const entries = fileNames ?? (await (0, promises_1.readdir)(this.resultsDir));
        const resultFiles = (await Promise.all(entries.map(async (file) => {
            if (node_path_1.default.basename(file) !== file ||
                !file.endsWith("-result.json")) {
                if (fileNames) {
                    throw new Error(`Invalid Allure result file name: ${file}`);
                }
                return null;
            }
            const filePath = node_path_1.default.join(this.resultsDir, file);
            const info = await (0, promises_1.stat)(filePath);
            return info.isFile() ? file : null;
        }))).filter((file) => file !== null);
        const results = await Promise.all(resultFiles.map((file) => this.resultParser.parse(file)));
        results.sort((a, b) => {
            const aStart = typeof a.start === "number" ? a.start : Number.MAX_SAFE_INTEGER;
            const bStart = typeof b.start === "number" ? b.start : Number.MAX_SAFE_INTEGER;
            return aStart - bStart;
        });
        return results;
    }
    /**
     * Parse aggregate values for the test_runs database row.
     */
    async parseRun(results) {
        const parsedResults = results ?? (await this.parse());
        return this.runParser.parse(parsedResults);
    }
    /**
     * Validate directory.
     */
    async assertDirectory() {
        let info;
        try {
            info = await (0, promises_1.stat)(this.resultsDir);
        }
        catch {
            throw new Error(`Allure results directory does not exist: ${this.resultsDir}`);
        }
        if (!info.isDirectory()) {
            throw new Error(`Allure results path is not a directory: ${this.resultsDir}`);
        }
    }
}
exports.AllureResultsParser = AllureResultsParser;
