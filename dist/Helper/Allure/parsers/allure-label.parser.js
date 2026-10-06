"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllureLabelParser = void 0;
class AllureLabelParser {
    parseMany(labels) {
        return labels.map((label) => ({ ...label }));
    }
}
exports.AllureLabelParser = AllureLabelParser;
