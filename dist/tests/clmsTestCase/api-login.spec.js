"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_fixtures_1 = require("../../src/fixtures/api.fixtures");
const api_1 = require("../../src/api");
api_fixtures_1.test.describe('CLMS Login API', () => {
    api_fixtures_1.test.skip('calls the login endpoint', async ({ api }) => {
        const baseUrl = process.env.BASE_API_URL;
        const username = process.env.CLMS_USER;
        const password = process.env.CLMS_PWD;
        if (!baseUrl || !username || !password) {
            throw new Error('BASE_API_URL, CLMS_USER, and CLMS_PWD must be configured');
        }
        await (0, api_1.loginToClms)(api, baseUrl, { username, password });
    });
});
