"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllureHelper = void 0;
const allure = __importStar(require("allure-js-commons"));
const toJson = (value) => {
    try {
        return JSON.stringify(value, null, 2);
    }
    catch {
        return String(value);
    }
};
class AllureHelper {
    static async setMetadata(metadata) {
        const { epic, feature, story, parentSuite, suite, subSuite, owner, severity, description, tags, links, } = metadata;
        if (epic)
            await allure.epic(epic);
        if (feature)
            await allure.feature(feature);
        if (story)
            await allure.story(story);
        if (parentSuite)
            await allure.parentSuite(parentSuite);
        if (suite)
            await allure.suite(suite);
        if (subSuite)
            await allure.subSuite(subSuite);
        if (owner)
            await allure.owner(owner);
        if (severity)
            await allure.severity(severity);
        if (description)
            await allure.description(description);
        if (tags?.length)
            await allure.tags(...tags);
        for (const link of links ?? []) {
            await allure.link(link.url, link.name ?? link.url, link.type);
        }
    }
    static async step(name, body) {
        let result;
        await allure.step(name, async () => {
            result = await body();
        });
        return result;
    }
    static async attachText(name, content) {
        await allure.attachment(name, content, 'text/plain');
    }
    static async attachJson(name, value) {
        await allure.attachment(name, toJson(value), 'application/json');
    }
    static async attachApiRequest(request) {
        await this.attachJson('API Request', request);
    }
    static async attachApiResponse(response) {
        await this.attachJson('API Response', response);
    }
    static async attachScreenshot(page, name = 'Screenshot') {
        const screenshot = await page.screenshot({ fullPage: true });
        await allure.attachment(name, screenshot, 'image/png');
    }
}
exports.AllureHelper = AllureHelper;
__exportStar(require("./Allure"), exports);
