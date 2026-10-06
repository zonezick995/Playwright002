"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllureStepParser = void 0;
const node_crypto_1 = require("node:crypto");
const allure_parameter_parser_1 = require("./allure-parameter.parser");
class AllureStepParser {
    constructor(attachmentParser, parameterParser = new allure_parameter_parser_1.AllureParameterParser()) {
        this.attachmentParser = attachmentParser;
        this.parameterParser = parameterParser;
    }
    /**
     * Parse nhiều steps.
     */
    async parseMany(steps, parentUuid = null) {
        return Promise.all(steps.map((step, index) => this.parse(step, index, parentUuid)));
    }
    /**
     * Parse một step.
     */
    async parse(step, stepOrder = 0, parentUuid = null) {
        const uuid = step.uuid ?? (0, node_crypto_1.randomUUID)();
        const childSteps = await this.parseMany(step.steps ?? [], uuid);
        const attachments = await this.attachmentParser.parseMany(step.attachments ?? []);
        const parameters = this.parameterParser.parseMany(step.parameters ?? []);
        const duration = this.calculateDuration(step.start, step.stop);
        return {
            ...step,
            uuid,
            steps: childSteps,
            attachments,
            parameters,
            description: step.name,
            stepOrder,
            parentUuid,
            duration,
        };
    }
    /**
     * Tính duration của step.
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
exports.AllureStepParser = AllureStepParser;
