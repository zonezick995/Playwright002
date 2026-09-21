"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPageActions = exports.retry = exports.resolveSelector = void 0;
const test_1 = require("@playwright/test");
const logger_1 = require("../Helper/utils/logger");
// ==================== HELPERS ====================
/**
* Resolve selector với template params
* Example: { template: '//button[text()=":action"]', params: { action: 'Login' } }
*/
const resolveSelector = (page, selector) => {
    if (typeof selector === 'string') {
        return page.locator(selector);
    }
    const resolved = Object.entries(selector.params || {}).reduce((s, [key, value]) => s.replaceAll(`:${key}`, String(value)), selector.template);
    return page.locator(resolved);
};
exports.resolveSelector = resolveSelector;
/**
* Retry action với configurable attempts
*/
const retry = async (action, options = {}) => {
    const { retries = 3, delayMs = 500 } = options;
    let lastError;
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await action();
        }
        catch (error) {
            lastError = error;
            logger_1.Logger.warn('UI', `[RETRY] ${attempt}/${retries} failed`);
            if (attempt < retries) {
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
    }
    throw lastError;
};
exports.retry = retry;
// ==================== MAIN COMPOSABLE ====================
/**
* Create page actions - Main composable function
* Returns grouped actions: navigation, input, assertions, etc.
*/
const createPageActions = (page) => {
    // Navigation
    const navigation = {
        goto: async (url, options) => {
            const { newTab = false, switchTo = true, waitUntil = 'load' } = options || {};
            if (!newTab) {
                await page.goto(url, { waitUntil });
                logger_1.Logger.info('UI', `→ ${url}`);
                return page;
            }
            const newPage = await page.context().newPage();
            await newPage.goto(url, { waitUntil });
            logger_1.Logger.info('UI', `→ ${url} (new tab)`);
            return switchTo ? newPage : page;
        },
    };
    // Click actions
    const click = async (selector, options) => {
        const loc = (0, exports.resolveSelector)(page, selector);
        logger_1.Logger.info('UI', `Click: "${selector}"`);
        await (0, exports.retry)(() => loc.click(), options);
    };
    // Input actions
    const input = {
        fill: async (selector, text, options) => {
            const loc = (0, exports.resolveSelector)(page, selector);
            logger_1.Logger.info('UI', `Fill: "${text}" to "${selector}"`);
            await (0, exports.retry)(() => loc.fill(text), options);
        },
        type: async (selector, text) => {
            const loc = (0, exports.resolveSelector)(page, selector);
            logger_1.Logger.info('UI', `Type: "${text}" to "${selector}"`);
            await loc.type(text);
        },
        press: async (selector, key) => {
            const loc = (0, exports.resolveSelector)(page, selector);
            logger_1.Logger.info('UI', `Press: "${key}" to "${selector}"`);
            await loc.press(key);
        },
        check: async (selector, options) => {
            const loc = (0, exports.resolveSelector)(page, selector);
            logger_1.Logger.info('UI', `Check "${selector}"`);
            await (0, exports.retry)(() => loc.check(), options);
        },
        uncheck: async (selector, options) => {
            const loc = (0, exports.resolveSelector)(page, selector);
            logger_1.Logger.info('UI', `Uncheck "${selector}"`);
            await (0, exports.retry)(() => loc.uncheck(), options);
        },
        uploadFile: async (selector, files) => {
            const loc = (0, exports.resolveSelector)(page, selector);
            logger_1.Logger.info('UI', `Upload file(s) to "${selector}"`);
            await (0, exports.retry)(() => loc.setInputFiles(files));
        },
        selectOption: async (selector, option) => {
            const loc = (0, exports.resolveSelector)(page, selector);
            logger_1.Logger.info('UI', `Select option "${option}" for "${selector}"`);
            await (0, exports.retry)(() => loc.selectOption(option));
        },
    };
    // Wait actions
    const wait = {
        forVisible: async (selector, timeout) => {
            const loc = (0, exports.resolveSelector)(page, selector);
            logger_1.Logger.info('UI', `Wait visible for "${selector}"`);
            await loc.waitFor({ state: 'visible', timeout });
        },
        forHidden: async (selector, timeout) => {
            const loc = (0, exports.resolveSelector)(page, selector);
            logger_1.Logger.info('UI', `Wait hidden for "${selector}"`);
            await loc.waitFor({ state: 'hidden', timeout });
        },
        forEnabled: async (selector) => {
            const loc = (0, exports.resolveSelector)(page, selector);
            logger_1.Logger.info('UI', `Wait enabled for "${selector}"`);
            await (0, test_1.expect)(loc).toBeEnabled();
        },
        timeout: (ms) => page.waitForTimeout(ms),
    };
    // Assertions
    const assert = {
        visible: async (selector) => {
            const loc = (0, exports.resolveSelector)(page, selector);
            logger_1.Logger.info('UI', `Assert visible: "${selector}"`);
            await (0, test_1.expect)(loc).toBeVisible();
        },
        hidden: async (selector) => {
            const loc = (0, exports.resolveSelector)(page, selector);
            logger_1.Logger.info('UI', `Assert hidden: "${selector}"`);
            await (0, test_1.expect)(loc).toBeHidden();
        },
        text: async (selector, expected) => {
            const loc = (0, exports.resolveSelector)(page, selector);
            logger_1.Logger.info('UI', `Assert text: "${expected}" for "${selector}"`);
            await (0, test_1.expect)(loc).toHaveText(expected);
        },
        containsText: async (selector, expected) => {
            const loc = (0, exports.resolveSelector)(page, selector);
            logger_1.Logger.info('UI', `Assert contains text: "${expected}" for "${selector}"`);
            await (0, test_1.expect)(loc).toContainText(expected);
        },
        enabled: async (selector) => {
            const loc = (0, exports.resolveSelector)(page, selector);
            logger_1.Logger.info('UI', `Assert enabled: "${selector}"`);
            await (0, test_1.expect)(loc).toBeEnabled();
        },
        url: async (expected) => {
            logger_1.Logger.info('UI', `Assert URL: "${expected}"`);
            await (0, test_1.expect)(page).toHaveURL(expected);
        },
        title: async (expected) => {
            logger_1.Logger.info('UI', `Assert title: "${expected}"`);
            await (0, test_1.expect)(page).toHaveTitle(expected);
        },
        // Soft assertions
        softVisible: async (selector, message) => {
            const loc = (0, exports.resolveSelector)(page, selector);
            logger_1.Logger.info('UI', `Soft assert visible: "${selector}"`);
            await test_1.expect.soft(loc, message).toBeVisible();
        },
        softText: async (selector, expected, message) => {
            const loc = (0, exports.resolveSelector)(page, selector);
            logger_1.Logger.info('UI', `Soft assert text: "${expected}" for "${selector}"`);
            await test_1.expect.soft(loc, message).toHaveText(expected);
        },
        // More assertions can be added here... 
    };
    // Get/Query actions
    const query = {
        getText: async (selector) => {
            const loc = (0, exports.resolveSelector)(page, selector);
            logger_1.Logger.info('UI', `Get text for "${selector}"`);
            return (await loc.textContent()) ?? '';
        },
        isVisible: async (selector) => {
            const loc = (0, exports.resolveSelector)(page, selector);
            logger_1.Logger.info('UI', `Check visibility for "${selector}"`);
            return await loc.isVisible();
        },
        isEnabled: async (selector) => {
            const loc = (0, exports.resolveSelector)(page, selector);
            logger_1.Logger.info('UI', `Check enabled for "${selector}"`);
            return await loc.isEnabled();
        },
        getAttribute: async (selector, name) => {
            const loc = (0, exports.resolveSelector)(page, selector);
            logger_1.Logger.info('UI', `Get attribute "${name}" for "${selector}"`);
            return await loc.getAttribute(name);
        },
        count: async (selector) => {
            const loc = (0, exports.resolveSelector)(page, selector);
            logger_1.Logger.info('UI', `Count elements for "${selector}"`);
            return await loc.count();
        },
    };
    // Scroll actions
    const scroll = {
        toElement: async (selector) => {
            const loc = (0, exports.resolveSelector)(page, selector);
            logger_1.Logger.info('UI', `Scroll to element "${selector}"`);
            await loc.scrollIntoViewIfNeeded();
        },
        toTop: async () => {
            logger_1.Logger.info('UI', `Scroll to top`);
            await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'auto' }));
        },
        toBottom: async () => {
            logger_1.Logger.info('UI', `Scroll to bottom`);
            await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'auto' }));
        },
        by: async (x, y) => {
            logger_1.Logger.info('UI', `Scroll by ${x},${y}`);
            await page.evaluate(([dx, dy]) => window.scrollBy(dx, dy), [x, y]);
        },
    };
    // Tab management
    const tabs = {
        switchTo: async (options) => {
            const { index, title, urlContains, timeoutMs = 5000 } = options;
            const context = page.context();
            const start = Date.now();
            logger_1.Logger.info('UI', `Switch tab: ${JSON.stringify(options)}`);
            while (Date.now() - start < timeoutMs) {
                const pages = context.pages();
                if (index !== undefined && pages[index]) {
                    await pages[index].bringToFront();
                    return pages[index];
                }
                for (const p of pages) {
                    if (title && (await p.title()).includes(title)) {
                        await p.bringToFront();
                        return p;
                    }
                    if (urlContains && p.url().includes(urlContains)) {
                        await p.bringToFront();
                        return p;
                    }
                }
                await page.waitForTimeout(300);
            }
            throw new Error(`Cannot switch tab: ${JSON.stringify(options)}`);
        },
        getAll: () => page.context().pages(),
        count: () => page.context().pages().length,
        closeOthers: async (keepPage) => {
            const pages = page.context().pages();
            await Promise.all(pages.filter(p => p !== keepPage).map(p => p.close()));
        },
    };
    // Hover & focus
    const interact = {
        hover: async (selector) => {
            const loc = (0, exports.resolveSelector)(page, selector);
            logger_1.Logger.info('UI', `Hover on "${selector}"`);
            await loc.hover();
        },
        focus: async (selector) => {
            const loc = (0, exports.resolveSelector)(page, selector);
            logger_1.Logger.info('UI', `Focus on "${selector}"`);
            await loc.focus();
        },
        blur: async (selector) => {
            const loc = (0, exports.resolveSelector)(page, selector);
            logger_1.Logger.info('UI', `Blur "${selector}"`);
            await loc.blur();
        },
    };
    // Return all grouped actions
    return {
        ...navigation,
        click,
        input,
        wait,
        assert,
        query,
        scroll,
        tabs,
        interact,
        // Direct page access
        page: () => page,
    };
};
exports.createPageActions = createPageActions;
