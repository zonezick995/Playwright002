import { Page, expect } from '@playwright/test';
import { Logger } from '../../Helper/utils/logger';
import { createPageActions } from '../BasePage';
import { ApiHelper } from '../../Helper/APIHelper';




// Type-safe credentials
export type Credentials = {
    username: string;
    password: string;
};

export const f_login = async (
    page: Page,
    { username, password }: Credentials
) => {

    const actions = createPageActions(page);
    //const baseUrl = process.env.ORANGE_BASE_URL_LOGIN;

    //if (!baseUrl) throw new Error('BASE_URL not set');

    Logger.info('UI', `Login as ${username}`);

    await actions.goto('https://the-internet.herokuapp.com/login');

    await page.getByRole('textbox', { name: 'Username' }).fill(username);
    await page.getByRole('textbox', { name: 'Password' }).fill(password);
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.locator('#flash')).toContainText('Your username is invalid!');

    Logger.info('UI', `✓ Logged in as ${username}`);

    await actions.wait.timeout(5000);
};

// API helper test
export const testAPIExample = async (page: Page) => {
  const response = await ApiHelper.post(process.env.BASE_API_URL + '/login',
    {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Channel': 'WEB',
        'X-Request-Id': 'a396d04a-553e-4ea7-80b4-82eb75872e7d',
      },
      body: {
        requestTrace: crypto.randomUUID(),
        requestDateTime: new Date().toISOString(),
        requestParameters: {
          username: ':user',
          password: ':pass'
        }
      },
      bodyParams: { user: 'ldosuser', pass: 'P@ss123456' }
    }
  );

  Logger.info('API', `✓ Response: ${JSON.stringify(response)}`);
  await page.waitForTimeout(5000);
};
 
