"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllureLinkParser = void 0;
class AllureLinkParser {
    parse(link) {
        return {
            name: link.name ?? link.url ?? null,
            url: link.url ?? null,
            type: link.type ?? null,
        };
    }
    parseMany(links) {
        return links.map((link) => this.parse(link));
    }
}
exports.AllureLinkParser = AllureLinkParser;
