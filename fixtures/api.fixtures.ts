import { test as base } from '@playwright/test';
import { ApiService } from '../api';

type ApiFixtures = {
  api: typeof ApiService;
};

export const test = base.extend<ApiFixtures>({
  api: async ({}, use) => {
    await use(ApiService);
  },
});

export { expect } from '@playwright/test';
