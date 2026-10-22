"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHeaderActions = exports.HEADER_SELECTORS = void 0;
const BasePage_1 = require("../../BasePage");
/**
* TypeScript Idiomatic: Header component actions
* Pure functions thay vì class
*/
exports.HEADER_SELECTORS = {
    logo: '[data-testid="header-logo"]',
    userMenu: '[data-testid="user-menu"]',
    userName: '[data-testid="user-name"]',
    logoutBtn: '[data-testid="logout-btn"]',
    notifications: '[data-testid="notifications"]',
    settings: '[data-testid="settings"]',
};
// Header actions
const createHeaderActions = (page) => {
    const actions = (0, BasePage_1.createPageActions)(page);
    return {
        openUserMenu: async () => {
            await actions.click(exports.HEADER_SELECTORS.userMenu);
        },
        logout: async () => {
            await actions.click(exports.HEADER_SELECTORS.userMenu);
            await actions.click(exports.HEADER_SELECTORS.logoutBtn);
        },
        getUserName: async () => {
            return await actions.query.getText(exports.HEADER_SELECTORS.userName);
        },
        openNotifications: async () => {
            await actions.click(exports.HEADER_SELECTORS.notifications);
        },
        openSettings: async () => {
            await actions.click(exports.HEADER_SELECTORS.settings);
        },
    };
};
exports.createHeaderActions = createHeaderActions;
