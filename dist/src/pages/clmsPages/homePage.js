"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.navigateToUserManagement = exports.HOME_SELECTORS = void 0;
/**
* TypeScript Idiomatic: Pure functions thay vì class
* Composable page actions
*/
exports.HOME_SELECTORS = {
    userManagement: 'xpath=//span[text()="Quản lý người dùng"]/parent::a',
};
// Example home page actions (có thể mở rộng)
const navigateToUserManagement = async (page) => {
    await page.locator(exports.HOME_SELECTORS.userManagement).click();
};
exports.navigateToUserManagement = navigateToUserManagement;
