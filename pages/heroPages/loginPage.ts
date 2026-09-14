import { Page, expect } from '@playwright/test';
import { Logger } from '../../Helper/utils/logger';
import { createPageActions } from '../BasePage';
import { ApiHelper } from '../../Helper/APIHelper';
import {
  assertStatusCode,
  assertBodyObject,
  assertFieldType,
  assertFieldValue,
  assertApiResponse,
} from '../../Helper/APIAssert';


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
  
  const response = await ApiHelper.post("https://rahulshettyacademy.com/maps/api/place/add/json",
    {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Channel': 'WEB',
        'X-Request-Id': 'a396d04a-553e-4ea7-80b4-82eb75872e7d',
      },
      body: {
        location: {
          lat: -38.383494,
          lng: 33.427362,
        },
        accuracy: 50,
        name: 'Frontline house',
        phone_number: '(+91) 983 893 3937',
        address: '29, side layout, cohen 09',
        types: ['shoe park', 'shop'],
        website: 'http://google.com',
        language: 'French-IN',
      },
      returnResponse: true,
    }
  );

  await assertStatusCode(response, 200);

  const body = await assertBodyObject(response.body);

  await assertFieldType(body, 'status', 'string');
  await assertFieldType(body, 'place_id', 'string');
  await assertFieldType(body, 'scope', 'string');
  await assertFieldType(body, 'reference', 'string');
  await assertFieldType(body, 'id', 'string');

  await assertFieldValue(body, 'status', 'OK');

  await assertApiResponse(response, {
    statusCode: 200,
    fieldTypes: {
      status: 'string',
      place_id: 'string',
      scope: 'string',
      reference: 'string',
      id: 'string',
    },
    fieldValues: {
      status: 'OK',
    },
  });

 
  Logger.info('API', `✓ Response: ${JSON.stringify(response)}`);

  await page.waitForTimeout(5000);
};
 
