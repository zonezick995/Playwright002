"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllureResultParser = void 0;
const promises_1 = require("node:fs/promises");
const node_path_1 = __importDefault(require("node:path"));
const allure_label_parser_1 = require("./allure-label.parser");
const allure_link_parser_1 = require("./allure-link.parser");
const allure_parameter_parser_1 = require("./allure-parameter.parser");
class AllureResultParser {
    constructor(resultsDir, stepParser, attachmentParser, parameterParser = new allure_parameter_parser_1.AllureParameterParser(), labelParser = new allure_label_parser_1.AllureLabelParser(), linkParser = new allure_link_parser_1.AllureLinkParser()) {
        this.resultsDir = resultsDir;
        this.stepParser = stepParser;
        this.attachmentParser = attachmentParser;
        this.parameterParser = parameterParser;
        this.labelParser = labelParser;
        this.linkParser = linkParser;
    }
    /**
     * Parse một file:
     *
     *     abc-result.json
     */
    async parse(fileName) {
        const filePath = node_path_1.default.resolve(this.resultsDir, fileName);
        const result = await this.readJson(filePath);
        this.validate(result, fileName);
        const steps = await this.stepParser.parseMany(result.steps ?? []);
        const attachments = await this.attachmentParser.parseMany(result.attachments ?? []);
        const parameters = this.parameterParser.parseMany(result.parameters ?? []);
        const labels = this.labelParser.parseMany(result.labels ?? []);
        const links = this.linkParser.parseMany(result.links ?? []);
        const duration = this.calculateDuration(result.start, result.stop);
        return {
            ...result,
            resultFile: fileName,
            resultFilePath: filePath,
            duration,
            steps,
            attachments,
            parameters,
            labels,
            links,
        };
    }
    /**
     * Đọc JSON.
     */
    async readJson(filePath) {
        let content;
        try {
            content = await (0, promises_1.readFile)(filePath, "utf8");
        }
        catch (error) {
            throw new Error(`Cannot read Allure result "${filePath}": ${error instanceof Error ? error.message : String(error)}`);
        }
        try {
            return JSON.parse(content);
        }
        catch (error) {
            throw new Error(`Invalid JSON "${filePath}": ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Validate result.
     */
    validate(result, fileName) {
        if (!result.uuid) {
            throw new Error(`Allure result "${fileName}" has no uuid`);
        }
        if (!result.name) {
            throw new Error(`Allure result "${fileName}" has no name`);
        }
        if (result.start != null && result.stop != null && result.stop < result.start) {
            throw new Error(`Allure result "${fileName}" has stop < start`);
        }
    }
    /**
     * Calculate duration.
     */
    calculateDuration(start, stop) {
        if (start == null || stop == null) {
            return undefined;
        }
        if (stop < start) {
            return undefined;
        }
        return stop - start;
    }
}
exports.AllureResultParser = AllureResultParser;
