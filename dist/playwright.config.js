"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const logger_1 = require("./Helper/utils/logger");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
logger_1.Logger.configure({
    enabled: true,
    minLevel: process.env.LOG_LEVEL === 'DEBUG' ? logger_1.LogLevel.DEBUG : logger_1.LogLevel.INFO,
});
// Generate timestamp in format YYYYMMDD-HHMMSS for report folder naming
const timestamp = new Date()
    .toLocaleString('sv-SE')
    .replace(/[-: ]/g, '')
    .slice(0, 15)
    .replace(/(\d{8})(\d{6})/, '$1-$2');
// Load environment variables from .env file based on NODE_ENV (default to 'sit')
const env = process.env.NODE_ENV || 'sit'; // NODE_ENV có thể là 'sit', 'uat', 'prod', v.v.
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, `.env.${env}`) }); // Load .env.sit, .env.uat, etc. based on NODE_ENV
exports.default = (0, test_1.defineConfig)({
    // Global setup and teardown
    globalTeardown: require.resolve('./global-teardown'), // optional, nếu có cần dọn dẹp sau khi chạy xong tất cả tests
    // Test directory
    testDir: './tests', // thư mục chứa test cases
    // Timeouts
    timeout: 60000, // timeout cho mỗi test
    expect: { timeout: 60000 }, // timeout cho các lệnh expect
    // Parallelism and retries
    fullyParallel: false,
    // Forbid test.only in CI
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: [
        ['html', {
                outputFolder: `test-report/${timestamp}`,
                open: 'never',
                title: 'Test Report',
            }],
        ['allure-playwright', {
                resultsDir: 'allure-results',
            }],
    ],
    // Shared settings for all projects
    use: {
        baseURL: process.env.BASE_URL || 'http://localhost:3000', // base URL cho các lệnh page.goto() và APIHelper
        trace: 'on-first-retry', // ghi lại trace chỉ khi test thất bại và được retry
        headless: process.env.PLAYWRIGHT_HEADLESS !== 'false', // mặc định chạy headless, chỉ chạy headed nếu explicitly set PLAYWRIGHT_HEADLESS=false
        screenshot: 'only-on-failure', // chụp screenshot chỉ khi test thất bại
        actionTimeout: 10000, // timeout mặc định cho các action như goto, click, fill, waitForSelector...
        navigationTimeout: 30000, // timeout cho các thao tác điều hướng
        viewport: { width: 1920, height: 1080 }, // kích thước màn hình
    },
    projects: [
        { name: 'chromium', use: { ...test_1.devices['Desktop Chrome'] } },
        // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
        // { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    ],
});
