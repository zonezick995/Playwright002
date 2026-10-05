import { Page } from '@playwright/test';
import * as allure from 'allure-js-commons';

export type AllureSeverity = 'blocker' | 'critical' | 'normal' | 'minor' | 'trivial';

export type AllureLink = {
  url: string;
  name?: string;
  type?: string;
};

export type AllureMetadata = {
  epic?: string;
  feature?: string;
  story?: string;
  parentSuite?: string;
  suite?: string;
  subSuite?: string;
  owner?: string;
  severity?: AllureSeverity;
  description?: string;
  tags?: string[];
  links?: AllureLink[];
};

export type ApiRequestAttachment = {
  method: string;
  url: string;
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  body?: unknown;
};

export type ApiResponseAttachment = {
  status: number;
  statusText?: string;
  headers?: Record<string, string>;
  body?: unknown;
};

const toJson = (value: unknown): string => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

export class AllureHelper {
  static async setMetadata(metadata: AllureMetadata): Promise<void> {
    const {
      epic,
      feature,
      story,
      parentSuite,
      suite,
      subSuite,
      owner,
      severity,
      description,
      tags,
      links,
    } = metadata;

    if (epic) await allure.epic(epic);
    if (feature) await allure.feature(feature);
    if (story) await allure.story(story);
    if (parentSuite) await allure.parentSuite(parentSuite);
    if (suite) await allure.suite(suite);
    if (subSuite) await allure.subSuite(subSuite);
    if (owner) await allure.owner(owner);
    if (severity) await allure.severity(severity);
    if (description) await allure.description(description);
    if (tags?.length) await allure.tags(...tags);

    for (const link of links ?? []) {
      await allure.link(link.url, link.name ?? link.url, link.type);
    }
  }

  static async step<T>(name: string, body: () => Promise<T>): Promise<T> {
    let result!: T;
    await allure.step(name, async () => {
      result = await body();
    });
    return result;
  }

  static async attachText(name: string, content: string): Promise<void> {
    await allure.attachment(name, content, 'text/plain');
  }

  static async attachJson(name: string, value: unknown): Promise<void> {
    await allure.attachment(name, toJson(value), 'application/json');
  }

  static async attachApiRequest(request: ApiRequestAttachment): Promise<void> {
    await this.attachJson('API Request', request);
  }

  static async attachApiResponse(response: ApiResponseAttachment): Promise<void> {
    await this.attachJson('API Response', response);
  }

  static async attachScreenshot(page: Page, name = 'Screenshot'): Promise<void> {
    const screenshot = await page.screenshot({ fullPage: true });
    await allure.attachment(name, screenshot, 'image/png');
  }
}
