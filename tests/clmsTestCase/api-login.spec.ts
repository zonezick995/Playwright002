import { test } from '../../fixtures/api.fixtures';
import { loginToClms } from '../../api';

test.describe('CLMS Login API', () => {
  test.skip('calls the login endpoint', async ({ api }) => {
    const baseUrl = process.env.BASE_API_URL;
    const username = process.env.CLMS_USER;
    const password = process.env.CLMS_PWD;

    if (!baseUrl || !username || !password) {
      throw new Error('BASE_API_URL, CLMS_USER, and CLMS_PWD must be configured');
    }

    await loginToClms(api, baseUrl, { username, password });
  });
});
