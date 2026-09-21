"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testAPIExample = exports.f_login = void 0;
const test_1 = require("@playwright/test");
const logger_1 = require("../../Helper/utils/logger");
const BasePage_1 = require("../BasePage");
const APIHelper_1 = require("../../Helper/APIHelper");
const APIAssert_1 = require("../../Helper/APIAssert");
const f_login = async (page, { username, password }) => {
    const actions = (0, BasePage_1.createPageActions)(page);
    //const baseUrl = process.env.ORANGE_BASE_URL_LOGIN;
    //if (!baseUrl) throw new Error('BASE_URL not set');
    logger_1.Logger.info('UI', `Login as ${username}`);
    await actions.goto('https://the-internet.herokuapp.com/login');
    await page.getByRole('textbox', { name: 'Username' }).fill(username);
    await page.getByRole('textbox', { name: 'Password' }).fill(password);
    await page.getByRole('button', { name: 'Login' }).click();
    await (0, test_1.expect)(page.locator('#flash')).toContainText('Your username is invalid!');
    logger_1.Logger.info('UI', `✓ Logged in as ${username}`);
    await actions.wait.timeout(5000);
};
exports.f_login = f_login;
// API helper test
const testAPIExample = async (page) => {
    const baseApiUrl = process.env.BASE_API_URL_DEMO_ADD_PLACE;
    if (!baseApiUrl) {
        throw new Error('BASE_API_URL_DEMO is not set');
    }
    const response = await APIHelper_1.ApiHelper.post(baseApiUrl, {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Channel': 'WEB',
            'X-Request-Id': 'a396d04a-553e-4ea7-80b4-82eb75872e7d',
        },
        body: {
            location: {
                lat: -38.383494,
                lng: 33.427362,
            },
            accuracy: 50,
            name: 'Frontline house',
            phone_number: '(+91) 983 893 3937',
            address: '29, side layout, cohen 09',
            types: ['shoe park', 'shop'],
            website: 'http://google.com',
            language: 'French-IN',
        },
        returnResponse: true,
    });
    await (0, APIAssert_1.assertStatusCode)(response, 200);
    const body = await (0, APIAssert_1.assertBodyObject)(response.body);
    await (0, APIAssert_1.assertFieldType)(body, 'status', 'string');
    await (0, APIAssert_1.assertFieldType)(body, 'place_id', 'string');
    await (0, APIAssert_1.assertFieldType)(body, 'scope', 'string');
    await (0, APIAssert_1.assertFieldType)(body, 'reference', 'string');
    await (0, APIAssert_1.assertFieldType)(body, 'id', 'string');
    await (0, APIAssert_1.assertFieldValue)(body, 'status', 'OK');
    await (0, APIAssert_1.assertApiResponse)(response, {
        statusCode: 200,
        fieldTypes: {
            status: 'string',
            place_id: 'string',
            scope: 'string',
            reference: 'string',
            id: 'string',
        },
        fieldValues: {
            status: 'OK',
        },
    });
    logger_1.Logger.info('API', `✓ Response: ${JSON.stringify(response)}`);
    await page.waitForTimeout(5000);
};
exports.testAPIExample = testAPIExample;
