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
    username: 'Admin',
    password: '12345!',
};
pom_fixtures_1.test.describe('Herokuapp Login Tests', () => {
    (0, pom_fixtures_1.test)('should login successfully', async ({ hero }) => {
        logger_1.Logger.info('TEST', '🧪 Testing login flow');
        await hero.login(CREDENTIALS);
    });
});
