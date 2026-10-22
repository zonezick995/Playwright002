import { Page, expect } from '@playwright/test';
import { Logger } from '../../Helper/utils/logger';
import { createPageActions } from '../BasePage';

export const HRM_SELECTORS = {
  username: 'input[name="username"]',
  password: 'input[name="password"]',
  commonBtn: 'button[type="submit"]',
  errorMessages: '.oxd-alert-content-text, .oxd-input-field-error-message',
} as const;

// Type-safe credentials
export type Credentials = {
  username: string;
  password: string;
};

export const f_login = async (
  page: Page,
  { username, password }: Credentials
) => {
  const actions = createPageActions(page);
  const baseUrl = process.env.ORANGE_BASE_URL_LOGIN;

  if (!baseUrl) throw new Error('BASE_URL not set');

  Logger.info('UI', `Login as ${username}`);

  await actions.goto(baseUrl);
  await actions.input.fill(HRM_SELECTORS.username, username);
  await actions.input.fill(HRM_SELECTORS.password, password);
  await actions.click(HRM_SELECTORS.commonBtn);

  await expect(page).toHaveURL('https://opensource-demo.orangehrmlive.com/web/index.php/dashboard/index');

  Logger.info('UI', `✓ Logged in as ${username}`);
  await actions.wait.timeout(5000);
};
