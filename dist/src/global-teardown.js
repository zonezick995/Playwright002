"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = globalTeardown;
const DatabaseFactory_1 = require("./Helper/utils/db/DatabaseFactory");
const logger_1 = require("./Helper/utils/logger");
async function globalTeardown() {
    try {
        logger_1.Logger.info('DB', 'Closing CLMS DB connections...');
        (0, DatabaseFactory_1.getDatabase)('mssql', 'CLMS')?.close();
        // Logger.info('DB', 'Closing DNA DB connections...');
        // getDatabase('oracle', 'DNA')?.close();
    }
    catch (e) {
        logger_1.Logger.error('DB', 'Error during database connections closing', e);
    }
}
