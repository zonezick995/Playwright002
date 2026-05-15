import { Page, expect } from '@playwright/test';
import { Database } from '../../Helper/utils/db/DatabaseFactory';
import { Logger } from '../../Helper/utils/logger';
import { ExcelHelper } from '../../Helper/ExcelHelper';
import { ApiHelper } from '../../Helper/APIHelper';

/**
* TypeScript Idiomatic: Pure functions + Composition
* Thay vì class hierarchy, sử dụng composable functions
*/

// Selectors as const (type-safe)
export const CLMS_SELECTORS = {
  username: '#userName',
  password: '#pwd',
  logo: 'img[alt="menuLogo"]',
  userAvatar: 'xpath=//span[@role="img" and(@aria-label="user")]',
  logoutBtn: 'xpath=//span[text()="Đăng xuất"]',
  salesCRMUsername: '#login_form_username',
  salesCRMPassword: '#login_form_password',
  commonBtn: (text: string) => 
    `xpath=//span[text()='${text}' and not(ancestor::div[@class='ant-modal-content'])]/parent::button[not(@style='display: none;') and not(ancestor::div[contains(@class,'ant-tabs-tabpane-hidden')])]`,
} as const;

// Type-safe credentials
export type Credentials = {
  username: string;
  password: string;
};

// Reusable page actions (composable)
const createActions = (page: Page) => ({
  fill: async (selector: string, value: string) => {
    await page.locator(selector).fill(value);
    Logger.info('UI', `Filled ${selector}`);
  },

  click: async (selector: string) => {
    await page.locator(selector).click();
    Logger.info('UI', `Clicked ${selector}`);
  },

  goto: async (url: string) => {
    await page.goto(url, { waitUntil: 'load' });
    Logger.info('UI', `Navigated to ${url}`);
  },

  expectVisible: async (selector: string) => {
    await expect(page.locator(selector)).toBeVisible();
  },

  wait: (ms: number) => page.waitForTimeout(ms),
});

// Main login function (pure, testable)
export const login = async (
  page: Page,
  { username, password }: Credentials
) => {
  const actions = createActions(page);
  const baseUrl = process.env.BASE_URL;

  if (!baseUrl) throw new Error('BASE_URL not set');

  Logger.info('UI', `Login as ${username}`);

  await actions.goto(baseUrl);
  await actions.fill(CLMS_SELECTORS.username, username);
  await actions.fill(CLMS_SELECTORS.password, password);
  await actions.click(CLMS_SELECTORS.commonBtn('Đăng nhập'));
  await actions.expectVisible(CLMS_SELECTORS.logo);

  Logger.info('UI', `✓ Logged in as ${username}`);
  await actions.wait(5000);
};

// Logout function
export const logout = async (page: Page) => {
  const actions = createActions(page);

  await actions.click(CLMS_SELECTORS.userAvatar);
  await actions.click(CLMS_SELECTORS.logoutBtn);

  Logger.info('UI', '✓ Logged out');
  await actions.wait(5000);
};

// Composed: Login + verify DB
export const loginAndVerifyDB = async (
  page: Page,
  credentials: Credentials,
  db: Database
) => {
  await login(page, credentials);

  const users = await db.query<Record<string, any>>('getAllActiveUsers', { 
    socongvan: '280802' 
  });

  expect(users).toBeDefined();
  expect(users.length).toBeGreaterThan(0);
  Logger.info('DB', `✓ Found ${users.length} active users`);

  return { users };
};

// Switch tab test (nếu cần dùng, có thể refactor tiếp)
export const testSwitchTab = async (
  page: Page,
  tabIndex: number,
  credentials: Credentials
) => {
  const actions = createActions(page);

  // Login to first app
  await login(page, credentials);
  await actions.wait(3000);

  // Open new tab with SalesCRM
  const [newPage] = await Promise.all([
    page.context().waitForEvent('page'),
    page.evaluate(() => window.open('URL', '_blank'))
  ]);

  await newPage.waitForLoadState('load');
  const salesActions = createActions(newPage);

  await salesActions.fill(CLMS_SELECTORS.salesCRMUsername, 'phatht01');
  await salesActions.fill(CLMS_SELECTORS.salesCRMPassword, 'Abc@123456');
  await salesActions.click(CLMS_SELECTORS.commonBtn('Đăng nhập'));
  await salesActions.wait(3000);

  // Switch back to specific tab
  const pages = page.context().pages();
  const targetPage = pages[tabIndex];
  await targetPage.bringToFront();

  Logger.info('UI', `✓ Switched to tab ${tabIndex}: ${await targetPage.title()}`);

  // Logout
  await logout(targetPage);
};

// Excel helper test
export const testExcelHelper = async (page: Page) => {
  const data = ExcelHelper.readSheet('./test-data/test-data.xlsx', 'TC01') as Record<string, any>;

  expect(data.length).toBeGreaterThan(0);
  Logger.info('TEST', `✓ Excel data: ${data.length} rows`);

  await page.waitForTimeout(5000);
};

// API helper test
export const testAPIHelper = async (page: Page) => {
  const response = await ApiHelper.post(process.env.BASE_API_URL + '/login',
    {
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
    }
  );

  Logger.info('API', `✓ Response: ${JSON.stringify(response)}`);
  await page.waitForTimeout(5000);
};
 