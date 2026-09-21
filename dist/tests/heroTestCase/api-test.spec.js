"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pom_fixtures_1 = require("../../fixtures/pom.fixtures");
pom_fixtures_1.test.describe('API Tests', () => {
    (0, pom_fixtures_1.test)('should create a place successfully', async ({ hero }) => {
        await hero.testAPI();
    });
});
