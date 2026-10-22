"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllureAttachmentParser = void 0;
const promises_1 = require("node:fs/promises");
const node_path_1 = __importDefault(require("node:path"));
class AllureAttachmentParser {
    constructor(resultsDir, options = {}) {
        this.resultsDir = resultsDir;
        this.options = options;
    }
    /**
     * Parse một attachment.
     */
    async parse(attachment) {
        const attachmentPath = node_path_1.default.resolve(this.resultsDir, attachment.source);
        let data;
        try {
            data = await (0, promises_1.readFile)(attachmentPath);
        }
        catch (error) {
            const isMissing = typeof error === "object" &&
                error !== null &&
                "code" in error &&
                error.code === "ENOENT";
            if (!isMissing) {
                throw new Error(`Cannot read Allure attachment "${attachmentPath}": ${error instanceof Error ? error.message : String(error)}`);
            }
            if (this.options.strict) {
                throw new Error(`Allure attachment not found: ${attachmentPath}`);
            }
            data = null;
        }
        const exists = data !== null;
        return {
            ...attachment,
            path: attachmentPath,
            exists,
            data,
        };
    }
    /**
     * Parse nhiều attachment.
     */
    async parseMany(attachments) {
        return Promise.all(attachments.map((attachment) => this.parse(attachment)));
    }
}
exports.AllureAttachmentParser = AllureAttachmentParser;
