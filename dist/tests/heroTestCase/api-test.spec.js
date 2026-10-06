"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pom_fixtures_1 = require("../../fixtures/pom.fixtures");
const logger_1 = require("../../Helper/utils/logger");
pom_fixtures_1.test.describe('API Tests', () => {
    (0, pom_fixtures_1.test)('should create a place successfully', async ({ hero }) => {
        logger_1.Logger.info('TEST', 'Starting API test: create a place');
        await hero.testAPI();
        logger_1.Logger.info('TEST', 'Completed API test: create a place');
    });
});
