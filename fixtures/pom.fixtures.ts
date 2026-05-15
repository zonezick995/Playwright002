import { test as base } from './db.fixtures';
import { Database } from '../Helper/utils/db/DatabaseFactory';
import * as CLMS from '../pages/clmsPages/loginPage';
import * as OHR from '../pages/orangeHr/loginPage';
import * as HERO from '../pages/heroPages/loginPage';

/**
* TypeScript Idiomatic: Functional fixtures
* Expose composable functions thay vì class instances
*/

type CLMSActions = {
  login: (credentials: CLMS.Credentials) => Promise<void>;
  logout: () => Promise<void>;
  loginAndVerifyDB: (credentials: CLMS.Credentials) => Promise<{ users: Array<Record<string, any>> }>;
  testSwitchTab: (tabIndex: number, credentials: CLMS.Credentials) => Promise<void>;
  testExcel: () => Promise<void>;
  testAPI: () => Promise<void>;
};

type OrangeHrActions = {
  login: (credentials: OHR.Credentials) => Promise<void>;
};

type herokuappActions = {
  login: (credentials: HERO.Credentials) => Promise<void>;
};


export const test = base.extend<{
  clms: CLMSActions;
  orangeHr: OrangeHrActions;
  hero: herokuappActions;
}>({

  clms: async ({ page, clmsDb }, use) => {
    // Inject dependencies vào pure functions
    await use({
      login: (creds) => CLMS.login(page, creds),
      logout: () => CLMS.logout(page),
      loginAndVerifyDB: (creds) => CLMS.loginAndVerifyDB(page, creds, clmsDb),
      testSwitchTab: (tabIndex, creds) => CLMS.testSwitchTab(page, tabIndex, creds),
      testExcel: () => CLMS.testExcelHelper(page),
      testAPI: () => CLMS.testAPIHelper(page),
    });
  },

  orangeHr: async ({ page }, use) => {
    await use({
      login: (creds) => OHR.f_login(page, creds),
    });
  },
  
  hero: async ({ page }, use) => {
    await use({
      login: (creds) => HERO.f_login(page, creds),
    });
  },
  
});

export { expect } from '@playwright/test';