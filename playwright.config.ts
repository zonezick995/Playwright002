import { defineConfig, devices } from '@playwright/test';
import { Logger, LogLevel } from './Helper/utils/logger';
import dotenv from 'dotenv';
import path from 'path';


Logger.configure({
  enabled: true,
  minLevel: process.env.LOG_LEVEL === 'DEBUG' ? LogLevel.DEBUG : LogLevel.INFO,
});

// Generate timestamp in format YYYYMMDD-HHMMSS for report folder naming
const timestamp = new Date()
  .toLocaleString('sv-SE')
  .replace(/[-: ]/g, '')
  .slice(0, 15)
  .replace(/(\d{8})(\d{6})/, '$1-$2');

// Load environment variables from .env file based on NODE_ENV (default to 'sit')
const env = process.env.NODE_ENV || 'sit';

dotenv.config({ path: path.resolve(__dirname, `.env.${env}`) });

export default defineConfig({
  // Global setup and teardown
  globalTeardown: require.resolve('./global-teardown'),

  // Test directory
  testDir: './tests',

  // Timeouts
  timeout: 60000, // timeout cho mỗi test
  expect: { timeout: 60000 }, // timeout cho các lệnh expect

  // Parallelism and retries
  fullyParallel: false,

  // Forbid test.only in CI
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', {
    outputFolder: `test-report/${timestamp}` || 'playwright-report',
    open: 'never',
    title: 'NEW CLMS Test Report',
  }]],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    headless: process.env.PLAYWRIGHT_HEADLESS !== 'false',
    screenshot: 'only-on-failure',
    actionTimeout: 10000, // timeout mặc định cho các action như goto, click, fill, waitForSelector...
    navigationTimeout: 30000, // timeout cho các thao tác điều hướng
    viewport: { width: 1920, height: 1080 },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
}); 