"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.f_login = exports.HRM_SELECTORS = void 0;
const test_1 = require("@playwright/test");
const logger_1 = require("../../Helper/utils/logger");
const BasePage_1 = require("../BasePage");
exports.HRM_SELECTORS = {
    username: 'input[name="username"]',
    password: 'input[name="password"]',
    commonBtn: 'button[type="submit"]',
    errorMessages: '.oxd-alert-content-text, .oxd-input-field-error-message',
};
const f_login = async (page, { username, password }) => {
    const actions = (0, BasePage_1.createPageActions)(page);
    const baseUrl = process.env.ORANGE_BASE_URL_LOGIN;
    if (!baseUrl)
        throw new Error('BASE_URL not set');
    logger_1.Logger.info('UI', `Login as ${username}`);
    await actions.goto(baseUrl);
    await actions.input.fill(exports.HRM_SELECTORS.username, username);
    await actions.input.fill(exports.HRM_SELECTORS.password, password);
    await actions.click(exports.HRM_SELECTORS.commonBtn);
    await (0, test_1.expect)(page).toHaveURL('https://opensource-demo.orangehrmlive.com/web/index.php/dashboard/index');
    logger_1.Logger.info('UI', `✓ Logged in as ${username}`);
    await actions.wait.timeout(5000);
};
exports.f_login = f_login;
