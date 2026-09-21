"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testAPIHelper = exports.testExcelHelper = exports.testSwitchTab = exports.loginAndVerifyDB = exports.logout = exports.login = exports.CLMS_SELECTORS = void 0;
const test_1 = require("@playwright/test");
const logger_1 = require("../../Helper/utils/logger");
const ExcelHelper_1 = require("../../Helper/ExcelHelper");
const APIHelper_1 = require("../../Helper/APIHelper");
/**
* TypeScript Idiomatic: Pure functions + Composition
* Thay vì class hierarchy, sử dụng composable functions
*/
// Selectors as const (type-safe)
exports.CLMS_SELECTORS = {
    username: '#userName',
    password: '#pwd',
    logo: 'img[alt="menuLogo"]',
    userAvatar: 'xpath=//span[@role="img" and(@aria-label="user")]',
    logoutBtn: 'xpath=//span[text()="Đăng xuất"]',
    salesCRMUsername: '#login_form_username',
    salesCRMPassword: '#login_form_password',
    commonBtn: (text) => `xpath=//span[text()='${text}' and not(ancestor::div[@class='ant-modal-content'])]/parent::button[not(@style='display: none;') and not(ancestor::div[contains(@class,'ant-tabs-tabpane-hidden')])]`,
};
// Reusable page actions (composable)
const createActions = (page) => ({
    fill: async (selector, value) => {
        await page.locator(selector).fill(value);
        logger_1.Logger.info('UI', `Filled ${selector}`);
    },
    click: async (selector) => {
        await page.locator(selector).click();
        logger_1.Logger.info('UI', `Clicked ${selector}`);
    },
    goto: async (url) => {
        await page.goto(url, { waitUntil: 'load' });
        logger_1.Logger.info('UI', `Navigated to ${url}`);
    },
    expectVisible: async (selector) => {
        await (0, test_1.expect)(page.locator(selector)).toBeVisible();
    },
    wait: (ms) => page.waitForTimeout(ms),
});
// Main login function (pure, testable)
const login = async (page, { username, password }) => {
    const actions = createActions(page);
    const baseUrl = process.env.BASE_URL;
    if (!baseUrl)
        throw new Error('BASE_URL not set');
    logger_1.Logger.info('UI', `Login as ${username}`);
    await actions.goto(baseUrl);
    await actions.fill(exports.CLMS_SELECTORS.username, username);
    await actions.fill(exports.CLMS_SELECTORS.password, password);
    await actions.click(exports.CLMS_SELECTORS.commonBtn('Đăng nhập'));
    await actions.expectVisible(exports.CLMS_SELECTORS.logo);
    logger_1.Logger.info('UI', `✓ Logged in as ${username}`);
    await actions.wait(5000);
};
exports.login = login;
// Logout function
const logout = async (page) => {
    const actions = createActions(page);
    await actions.click(exports.CLMS_SELECTORS.userAvatar);
    await actions.click(exports.CLMS_SELECTORS.logoutBtn);
    logger_1.Logger.info('UI', '✓ Logged out');
    await actions.wait(5000);
};
exports.logout = logout;
// Composed: Login + verify DB
const loginAndVerifyDB = async (page, credentials, db) => {
    await (0, exports.login)(page, credentials);
    const users = await db.query('getAllActiveUsers', {
        socongvan: '280802'
    });
    (0, test_1.expect)(users).toBeDefined();
    (0, test_1.expect)(users.length).toBeGreaterThan(0);
    logger_1.Logger.info('DB', `✓ Found ${users.length} active users`);
    return { users };
};
exports.loginAndVerifyDB = loginAndVerifyDB;
// Switch tab test (nếu cần dùng, có thể refactor tiếp)
const testSwitchTab = async (page, tabIndex, credentials) => {
    const actions = createActions(page);
    // Login to first app
    await (0, exports.login)(page, credentials);
    await actions.wait(3000);
    // Open new tab with SalesCRM
    const [newPage] = await Promise.all([
        page.context().waitForEvent('page'),
        page.evaluate(() => window.open('URL', '_blank'))
    ]);
    await newPage.waitForLoadState('load');
    const salesActions = createActions(newPage);
    await salesActions.fill(exports.CLMS_SELECTORS.salesCRMUsername, 'phatht01');
    await salesActions.fill(exports.CLMS_SELECTORS.salesCRMPassword, 'Abc@123456');
    await salesActions.click(exports.CLMS_SELECTORS.commonBtn('Đăng nhập'));
    await salesActions.wait(3000);
    // Switch back to specific tab
    const pages = page.context().pages();
    const targetPage = pages[tabIndex];
    await targetPage.bringToFront();
    logger_1.Logger.info('UI', `✓ Switched to tab ${tabIndex}: ${await targetPage.title()}`);
    // Logout
    await (0, exports.logout)(targetPage);
};
exports.testSwitchTab = testSwitchTab;
// Excel helper test
const testExcelHelper = async (page) => {
    const data = ExcelHelper_1.ExcelHelper.readSheet('./test-data/test-data.xlsx', 'TC01');
    (0, test_1.expect)(data.length).toBeGreaterThan(0);
    logger_1.Logger.info('TEST', `✓ Excel data: ${data.length} rows`);
    await page.waitForTimeout(5000);
};
exports.testExcelHelper = testExcelHelper;
// API helper test
const testAPIHelper = async (page) => {
    const response = await APIHelper_1.ApiHelper.post(process.env.BASE_API_URL + '/login', {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Channel': 'WEB',
            'X-Request-Id': 'a396d04a-553e-4ea7-80b4-82eb75872e7d',
        },
        body: {
            requestTrace: crypto.randomUUID(),
            requestDateTime: new Date().toISOString(),
            requestParameters: {
                username: ':user',
                password: ':pass'
            }
        },
        bodyParams: { user: 'ldosuser', pass: 'P@ss123456' }
    });
    logger_1.Logger.info('API', `✓ Response: ${JSON.stringify(response)}`);
    await page.waitForTimeout(5000);
};
exports.testAPIHelper = testAPIHelper;
