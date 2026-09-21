"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pom_fixtures_1 = require("../../fixtures/pom.fixtures");
const logger_1 = require("../../Helper/utils/logger");
/**
* TypeScript Idiomatic Test Suite
* ✅ Functional composition thay vì class hierarchy
* ✅ Type-safe credentials
* ✅ Composable actions: clms.login() thay vì pm.clmsLoginPage.login()
*/
// Type-safe credentials
const CREDENTIALS = {
    username: process.env.CLMS_USER,
    password: process.env.CLMS_PWD,
};
pom_fixtures_1.test.describe('CLMS Login Tests', () => {
    (0, pom_fixtures_1.test)('should login successfully', async ({ clms }) => {
        logger_1.Logger.info('TEST', '🧪 Testing login flow');
        await clms.login(CREDENTIALS);
    });
    (0, pom_fixtures_1.test)('should login and verify database', async ({ clms }) => {
        logger_1.Logger.info('TEST', '🧪 Testing login with DB verification');
        const { users } = await clms.loginAndVerifyDB(CREDENTIALS);
        (0, pom_fixtures_1.expect)(users).toBeDefined();
        (0, pom_fixtures_1.expect)(users.length).toBeGreaterThan(0);
        logger_1.Logger.info('TEST', `✓ Verified ${users.length} users`);
    });
    pom_fixtures_1.test.skip('should handle multi-tab switching', async ({ clms }) => {
        logger_1.Logger.info('TEST', '🧪 Testing tab switching');
        await clms.testSwitchTab(0, CREDENTIALS);
    });
    pom_fixtures_1.test.skip('should read excel data', async ({ clms }) => {
        logger_1.Logger.info('TEST', '🧪 Testing Excel helper');
        await clms.testExcel();
    });
    pom_fixtures_1.test.skip('should call API', async ({ clms }) => {
        logger_1.Logger.info('TEST', '🧪 Testing API helper');
        await clms.testAPI();
    });
});
