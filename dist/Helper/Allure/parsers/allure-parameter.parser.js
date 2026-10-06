"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllureParameterParser = void 0;
class AllureParameterParser {
    parse(parameter) {
        return {
            name: parameter.name,
            value: parameter.value ?? null,
            exclude: parameter.exclude ?? parameter.excluded ?? false,
            mode: parameter.mode ?? null,
        };
    }
    parseMany(parameters) {
        return parameters.map((parameter) => this.parse(parameter));
    }
}
exports.AllureParameterParser = AllureParameterParser;
