import { test, expect } from '../../src/fixtures/pom.fixtures';
import { Logger } from '../../src/Helper/utils/logger';

/**
* TypeScript Idiomatic Test Suite
* ✅ Functional composition thay vì class hierarchy
* ✅ Type-safe credentials
* ✅ Composable actions: clms.login() thay vì pm.clmsLoginPage.login()
*/

// Type-safe credentials
const CREDENTIALS = {
  username: process.env.ORANGE_HR_USERNAME!,
  password: process.env.RANGE_HR_PASSWORD!,
};

test.describe('Orange HR Login Tests', () => {

  test('should login successfully', async ({ orangeHr }) => {
    Logger.info('TEST', '🧪 Testing login flow');
    await orangeHr.login(CREDENTIALS);
  });

});
