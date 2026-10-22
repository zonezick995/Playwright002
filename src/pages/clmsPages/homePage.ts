import { Page } from '@playwright/test';
import { Database } from '../../Helper/utils/db/DatabaseFactory';
import { Logger } from '../../Helper/utils/logger';

/**
* TypeScript Idiomatic: Pure functions thay vì class
* Composable page actions
*/

export const HOME_SELECTORS = {
  userManagement: 'xpath=//span[text()="Quản lý người dùng"]/parent::a',
} as const;

// Example home page actions (có thể mở rộng)
export const navigateToUserManagement = async (page: Page) => {
  await page.locator(HOME_SELECTORS.userManagement).click();
};