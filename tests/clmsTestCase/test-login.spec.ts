import { test, expect } from '../../fixtures/pom.fixtures';
import { Logger } from '../../Helper/utils/logger';

/**
* TypeScript Idiomatic Test Suite
* ✅ Functional composition thay vì class hierarchy
* ✅ Type-safe credentials
* ✅ Composable actions: clms.login() thay vì pm.clmsLoginPage.login()
*/

// Type-safe credentials
const CREDENTIALS = {
  username: process.env.CLMS_USER!,
  password: process.env.CLMS_PWD!,
};

test.describe('CLMS Login Tests', () => {

  test('should login successfully', async ({ clms }) => {
    Logger.info('TEST', '🧪 Testing login flow');
    await clms.login(CREDENTIALS);
  });

  test('should login and verify database', async ({ clms }) => {
    Logger.info('TEST', '🧪 Testing login with DB verification');

    const { users } = await clms.loginAndVerifyDB(CREDENTIALS);

    expect(users).toBeDefined();
    expect(users.length).toBeGreaterThan(0);
    Logger.info('TEST', `✓ Verified ${users.length} users`);
  });

  test.skip('should handle multi-tab switching', async ({ clms }) => {
    Logger.info('TEST', '🧪 Testing tab switching');
    await clms.testSwitchTab(0, CREDENTIALS);
  });

  test.skip('should read excel data', async ({ clms }) => {
    Logger.info('TEST', '🧪 Testing Excel helper');
    await clms.testExcel();
  });

  test.skip('should call API', async ({ clms }) => {
    Logger.info('TEST', '🧪 Testing API helper');
    await clms.testAPI();
  });
});