import { Page, Locator, expect } from '@playwright/test';
import { Logger } from '../Helper/utils/logger';
import { url } from 'inspector';

/**
* TypeScript Idiomatic: Composable Page Utilities
* 
* Thay vì kế thừa class, import và sử dụng functions này
* Pure functions, reusable, testable, tree-shakeable
* 
* Example usage:
* ```ts
* const actions = createPageActions(page);
* await actions.fill('#username', 'admin');
* await actions.click('#login-btn');
* await actions.assert.visible('#dashboard');
* ```
*/

// ==================== TYPES ====================

export type Selector = string | {
  template: string;
  params?: Record<string, string | number>;
};

type RetryOptions = {
  retries?: number;
  delayMs?: number;
};

// ==================== HELPERS ====================

/**
* Resolve selector với template params
* Example: { template: '//button[text()=":action"]', params: { action: 'Login' } }
*/
export const resolveSelector = (page: Page, selector: Selector): Locator => {
  if (typeof selector === 'string') {
    return page.locator(selector);
  }

  const resolved = Object.entries(selector.params || {}).reduce(
    (s, [key, value]) => s.replaceAll(`:${key}`, String(value)),
    selector.template
  );

  return page.locator(resolved);
};

/**
* Retry action với configurable attempts
*/
export const retry = async <T>(
  action: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const { retries = 3, delayMs = 500 } = options;
  let lastError: unknown;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await action();
    } catch (error) {
      lastError = error;
      Logger.warn('UI', `[RETRY] ${attempt}/${retries} failed`);

      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError;
};

// ==================== MAIN COMPOSABLE ====================

/**
* Create page actions - Main composable function
* Returns grouped actions: navigation, input, assertions, etc.
*/
export const createPageActions = (page: Page) => {
  // Navigation
  const navigation = {
    goto: async (
      url: string,
      options?: {
        newTab?: boolean;
        switchTo?: boolean;
        waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
      }
    ): Promise<Page> => {
      const { newTab = false, switchTo = true, waitUntil = 'load' } = options || {};

      if (!newTab) {
        await page.goto(url, { waitUntil });
        Logger.info('UI', `→ ${url}`);
        return page;
      }

      const newPage = await page.context().newPage();
      await newPage.goto(url, { waitUntil });
      Logger.info('UI', `→ ${url} (new tab)`);

      return switchTo ? newPage : page;
    },
  };

  // Click actions
  const click = async (selector: Selector, options?: RetryOptions) => {
    const loc = resolveSelector(page, selector);
    Logger.info('UI', `Click: "${selector}"`);
    await retry(() => loc.click(), options);
  };

  // Input actions
  const input = {
    fill: async (selector: Selector, text: string, options?: RetryOptions) => {
      const loc = resolveSelector(page, selector);
      Logger.info('UI', `Fill: "${text}" to "${selector}"`);
      await retry(() => loc.fill(text), options);
    },

    type: async (selector: Selector, text: string) => {
      const loc = resolveSelector(page, selector);
      Logger.info('UI', `Type: "${text}" to "${selector}"`);
      await loc.type(text);
    },

    press: async (selector: Selector, key: string) => {
      const loc = resolveSelector(page, selector);
      Logger.info('UI', `Press: "${key}" to "${selector}"`);
      await loc.press(key);
    },

    check: async (selector: Selector, options?: RetryOptions) => {
      const loc = resolveSelector(page, selector);
      Logger.info('UI', `Check "${selector}"`);
      await retry(() => loc.check(), options);
    },

    uncheck: async (selector: Selector, options?: RetryOptions) => {
      const loc = resolveSelector(page, selector);
      Logger.info('UI', `Uncheck "${selector}"`);
      await retry(() => loc.uncheck(), options);
    },

    uploadFile: async (selector: Selector, files: string | string[]) => {
      const loc = resolveSelector(page, selector);
      Logger.info('UI', `Upload file(s) to "${selector}"`);
      await retry(() => loc.setInputFiles(files));
    },

    selectOption: async (selector: Selector, option: string | string[]) => {
      const loc = resolveSelector(page, selector);
      Logger.info('UI', `Select option "${option}" for "${selector}"`);
      await retry(() => loc.selectOption(option));
    },
  };

  // Wait actions
  const wait = {
    forVisible: async (selector: Selector, timeout?: number) => {
      const loc = resolveSelector(page, selector);
      Logger.info('UI', `Wait visible for "${selector}"`);
      await loc.waitFor({ state: 'visible', timeout });
    },

    forHidden: async (selector: Selector, timeout?: number) => {
      const loc = resolveSelector(page, selector);
      Logger.info('UI', `Wait hidden for "${selector}"`);
      await loc.waitFor({ state: 'hidden', timeout });
    },

    forEnabled: async (selector: Selector) => {
      const loc = resolveSelector(page, selector);
      Logger.info('UI', `Wait enabled for "${selector}"`);
      await expect(loc).toBeEnabled();
    },

    timeout: (ms: number) => page.waitForTimeout(ms),
  };

  // Assertions
  const assert = {
    visible: async (selector: Selector) => {
      const loc = resolveSelector(page, selector);
      Logger.info('UI', `Assert visible: "${selector}"`);
      await expect(loc).toBeVisible();
    },

    hidden: async (selector: Selector) => {
      const loc = resolveSelector(page, selector);
      Logger.info('UI', `Assert hidden: "${selector}"`);
      await expect(loc).toBeHidden();
    },

    text: async (selector: Selector, expected: string | RegExp) => {
      const loc = resolveSelector(page, selector);
      Logger.info('UI', `Assert text: "${expected}" for "${selector}"`);
      await expect(loc).toHaveText(expected);
    },

    containsText: async (selector: Selector, expected: string) => {
      const loc = resolveSelector(page, selector);
      Logger.info('UI', `Assert contains text: "${expected}" for "${selector}"`);
      await expect(loc).toContainText(expected);
    },

    enabled: async (selector: Selector) => {
      const loc = resolveSelector(page, selector);
      Logger.info('UI', `Assert enabled: "${selector}"`);
      await expect(loc).toBeEnabled();
    },

    url: async (expected: string | RegExp) => {
      Logger.info('UI', `Assert URL: "${expected}"`);
      await expect(page).toHaveURL(expected);
    },

    title: async (expected: string | RegExp) => {
      Logger.info('UI', `Assert title: "${expected}"`);
      await expect(page).toHaveTitle(expected);
    },


    // Soft assertions
    softVisible: async (selector: Selector, message?: string) => {
      const loc = resolveSelector(page, selector);
      Logger.info('UI', `Soft assert visible: "${selector}"`);
      await expect.soft(loc, message).toBeVisible();
    },

    softText: async (selector: Selector, expected: string, message?: string) => {
      const loc = resolveSelector(page, selector);
      Logger.info('UI', `Soft assert text: "${expected}" for "${selector}"`);
      await expect.soft(loc, message).toHaveText(expected);
    },
    

    // More assertions can be added here... 
  };

  // Get/Query actions
  const query = {
    getText: async (selector: Selector): Promise<string> => {
      const loc = resolveSelector(page, selector);
      Logger.info('UI', `Get text for "${selector}"`);
      return (await loc.textContent()) ?? '';
    },

    isVisible: async (selector: Selector): Promise<boolean> => {
      const loc = resolveSelector(page, selector);
      Logger.info('UI', `Check visibility for "${selector}"`);
      return await loc.isVisible();
    },

    isEnabled: async (selector: Selector): Promise<boolean> => {
      const loc = resolveSelector(page, selector);
      Logger.info('UI', `Check enabled for "${selector}"`);
      return await loc.isEnabled();
    },

    getAttribute: async (selector: Selector, name: string): Promise<string | null> => {
      const loc = resolveSelector(page, selector);
      Logger.info('UI', `Get attribute "${name}" for "${selector}"`);
      return await loc.getAttribute(name);
    },

    count: async (selector: Selector): Promise<number> => {
      const loc = resolveSelector(page, selector);
      Logger.info('UI', `Count elements for "${selector}"`);
      return await loc.count();
    },
  };

  // Scroll actions
  const scroll = {
    toElement: async (selector: Selector) => {
      const loc = resolveSelector(page, selector);
      Logger.info('UI', `Scroll to element "${selector}"`);
      await loc.scrollIntoViewIfNeeded();
    },

    toTop: async () => {
      Logger.info('UI', `Scroll to top`);
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'auto' }));
    },

    toBottom: async () => {
      Logger.info('UI', `Scroll to bottom`);
      await page.evaluate(() => 
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'auto' })
      );
    },

    by: async (x: number, y: number) => {
      Logger.info('UI', `Scroll by ${x},${y}`);
      await page.evaluate(([dx, dy]) => window.scrollBy(dx, dy), [x, y]);
    },
  };

  // Tab management
  const tabs = {
    switchTo: async (options: {
      index?: number;
      title?: string;
      urlContains?: string;
      timeoutMs?: number;
    }): Promise<Page> => {
      const { index, title, urlContains, timeoutMs = 5000 } = options;
      const context = page.context();
      const start = Date.now();

      Logger.info('UI', `Switch tab: ${JSON.stringify(options)}`);

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

    getAll: (): Page[] => page.context().pages(),

    count: (): number => page.context().pages().length,

    closeOthers: async (keepPage: Page) => {
      const pages = page.context().pages();
      await Promise.all(
        pages.filter(p => p !== keepPage).map(p => p.close())
      );
    },
  };

  // Hover & focus
  const interact = {
    hover: async (selector: Selector) => {
      const loc = resolveSelector(page, selector);
      Logger.info('UI', `Hover on "${selector}"`);
      await loc.hover();
    },

    focus: async (selector: Selector) => {
      const loc = resolveSelector(page, selector);
      Logger.info('UI', `Focus on "${selector}"`);
      await loc.focus();
    },

    blur: async (selector: Selector) => {
      const loc = resolveSelector(page, selector);
      Logger.info('UI', `Blur "${selector}"`);
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

// ==================== TYPE EXPORTS ====================

export type PageActions = ReturnType<typeof createPageActions>;
 