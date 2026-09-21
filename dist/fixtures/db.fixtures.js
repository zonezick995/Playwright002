"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expect = exports.test = void 0;
const test_1 = require("@playwright/test");
const DatabaseFactory_1 = require("../Helper/utils/db/DatabaseFactory");
exports.test = test_1.test.extend({
    clmsDb: async ({}, use) => {
        const db = (0, DatabaseFactory_1.getDatabase)('mssql', 'CLMS');
        await use(db);
        // KHÔNG close ở đây, vì singleton được reuse
    },
    dnaDb: async ({}, use) => {
        const db = (0, DatabaseFactory_1.getDatabase)('oracle', 'DNAA');
        await use(db);
    },
});
var test_2 = require("@playwright/test");
Object.defineProperty(exports, "expect", { enumerable: true, get: function () { return test_2.expect; } });
