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
Object.defineProperty(exports, "__esModule", { value: true });
exports.expect = exports.test = void 0;
const db_fixtures_1 = require("./db.fixtures");
const CLMS = __importStar(require("../pages/clmsPages/loginPage"));
const OHR = __importStar(require("../pages/orangeHr/loginPage"));
const HERO = __importStar(require("../pages/heroPages/loginPage"));
// Extend base test with our custom fixtures
exports.test = db_fixtures_1.test.extend({
    // CLMS fixture with composable actions
    clms: async ({ page, clmsDb }, use) => {
        // Inject dependencies vào pure functions
        await use({
            login: (creds) => CLMS.login(page, creds),
            logout: () => CLMS.logout(page),
            loginAndVerifyDB: (creds) => CLMS.loginAndVerifyDB(page, creds, clmsDb),
            testSwitchTab: (tabIndex, creds) => CLMS.testSwitchTab(page, tabIndex, creds),
            testExcel: () => CLMS.testExcelHelper(page),
            testAPI: () => CLMS.testAPIHelper(page),
        });
    },
    // OrangeHR fixture with composable actions
    orangeHr: async ({ page }, use) => {
        await use({
            login: (creds) => OHR.f_login(page, creds),
        });
    },
    //  Herokuapp fixture with composable actions
    hero: async ({ page }, use) => {
        await use({
            login: (creds) => HERO.f_login(page, creds),
            testAPI: () => HERO.testAPIExample(page),
        });
    },
});
var test_1 = require("@playwright/test");
Object.defineProperty(exports, "expect", { enumerable: true, get: function () { return test_1.expect; } });
