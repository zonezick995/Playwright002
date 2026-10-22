import { Page } from '@playwright/test';
import { createPageActions } from '../../BasePage';

/**
* TypeScript Idiomatic: Header component actions
* Pure functions thay vì class
*/

export const HEADER_SELECTORS = {
  logo: '[data-testid="header-logo"]',
  userMenu: '[data-testid="user-menu"]',
  userName: '[data-testid="user-name"]',
  logoutBtn: '[data-testid="logout-btn"]',
  notifications: '[data-testid="notifications"]',
  settings: '[data-testid="settings"]',
} as const;

// Header actions
export const createHeaderActions = (page: Page) => {
  const actions = createPageActions(page);

  return {
    openUserMenu: async () => {
      await actions.click(HEADER_SELECTORS.userMenu);
    },

    logout: async () => {
      await actions.click(HEADER_SELECTORS.userMenu);
      await actions.click(HEADER_SELECTORS.logoutBtn);
    },

    getUserName: async (): Promise<string> => {
      return await actions.query.getText(HEADER_SELECTORS.userName);
    },

    openNotifications: async () => {
      await actions.click(HEADER_SELECTORS.notifications);
    },

    openSettings: async () => {
      await actions.click(HEADER_SELECTORS.settings);
    },
  };
};

export type HeaderActions = ReturnType<typeof createHeaderActions>;
 