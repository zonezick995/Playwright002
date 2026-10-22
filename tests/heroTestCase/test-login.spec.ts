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
  username: 'Admin',
  password: '12345!',
};

test.describe('Herokuapp Login Tests', () => {

  test('should login successfully', async ({ hero }) => {
    Logger.info('TEST', '🧪 Testing login flow');
    await hero.login(CREDENTIALS);
  });

});
