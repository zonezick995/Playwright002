"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllureMetadataParser = void 0;
const promises_1 = require("node:fs/promises");
const node_path_1 = __importDefault(require("node:path"));
class AllureMetadataParser {
    constructor(resultsDir) {
        this.resultsDir = resultsDir;
    }
    async parse() {
        const [environment, categories, executor, history] = await Promise.all([
            this.parseEnvironment(),
            this.parseCategories(),
            this.parseExecutor(),
            this.parseHistory(),
        ]);
        return { environment, categories, executor, history };
    }
    async parseEnvironment() {
        const filePath = node_path_1.default.join(this.resultsDir, "environment.properties");
        const content = await this.readOptionalText(filePath);
        const properties = {};
        for (const line of content?.split(/\r?\n/) ?? []) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("!")) {
                continue;
            }
            const separator = trimmed.search(/(?<!\\)[=:]/);
            if (separator < 0) {
                properties[this.unescapeProperty(trimmed)] = "";
                continue;
            }
            const key = this.unescapeProperty(trimmed.slice(0, separator).trim());
            const value = this.unescapeProperty(trimmed.slice(separator + 1).trim());
            if (key) {
                properties[key] = value;
            }
        }
        return properties;
    }
    async parseCategories() {
        const value = await this.readOptionalJson(node_path_1.default.join(this.resultsDir, "categories.json"));
        if (value == null) {
            return [];
        }
        if (!Array.isArray(value)) {
            throw new Error("Allure categories.json must contain a JSON array.");
        }
        return value.map((category, index) => {
            if (typeof category !== "object" ||
                category === null ||
                Array.isArray(category) ||
                typeof category.name !== "string" ||
                category.name.length === 0) {
                throw new Error(`Allure categories.json item ${index} must have a non-empty name.`);
            }
            return category;
        });
    }
    async parseExecutor() {
        const value = await this.readOptionalJson(node_path_1.default.join(this.resultsDir, "executor.json"));
        if (value == null) {
            return null;
        }
        if (typeof value !== "object" || Array.isArray(value)) {
            throw new Error("Allure executor.json must contain a JSON object.");
        }
        return value;
    }
    async parseHistory() {
        const historyDir = node_path_1.default.join(this.resultsDir, "history");
        let files;
        try {
            files = await (0, promises_1.readdir)(historyDir);
        }
        catch (error) {
            if (this.isMissing(error)) {
                return {};
            }
            throw error;
        }
        const entries = await Promise.all(files
            .filter((file) => file.endsWith(".json") && node_path_1.default.basename(file) === file)
            .map(async (file) => {
            const value = await this.readRequiredJson(node_path_1.default.join(historyDir, file));
            return [file, value];
        }));
        return Object.fromEntries(entries);
    }
    async readOptionalJson(filePath) {
        const content = await this.readOptionalText(filePath);
        if (content == null) {
            return null;
        }
        try {
            return JSON.parse(content);
        }
        catch (error) {
            throw new Error(`Invalid Allure metadata JSON "${filePath}": ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async readRequiredJson(filePath) {
        const content = await this.readOptionalText(filePath);
        if (content == null) {
            throw new Error(`Allure history file disappeared while parsing: ${filePath}`);
        }
        try {
            return JSON.parse(content);
        }
        catch (error) {
            throw new Error(`Invalid Allure history JSON "${filePath}": ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async readOptionalText(filePath) {
        try {
            return await (0, promises_1.readFile)(filePath, "utf8");
        }
        catch (error) {
            if (this.isMissing(error)) {
                return null;
            }
            throw new Error(`Cannot read Allure metadata "${filePath}": ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    isMissing(error) {
        return (typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === "ENOENT");
    }
    unescapeProperty(value) {
        return value.replace(/\\([\\:=#! ])/g, "$1");
    }
}
exports.AllureMetadataParser = AllureMetadataParser;
