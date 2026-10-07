import { expect, test } from '@playwright/test';

const endpoint = 'https://rahulshettyacademy.com/Library/Addbook.php';
const book = {
  name: 'Learn Appium Automation with Java',
  isbn: 'aspernatur',
  aisle: `651${Date.now() % 1000}`,
  author: 'Fernando Street',
};
const expectedId = `${book.isbn}${book.aisle}`;

test.describe.serial('Library Add Book API', () => {
  test('TC-01 adds a new book and returns its generated ID', async ({ request }) => {
    const response = await test.step('POST the new book', () =>
      request.post(endpoint, {
        headers: { 'Content-Type': 'application/json' },
        data: book,
      }),
    );

    const responseText = await response.text();
    expect(response.status(), `API response body: ${responseText}`).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');
    expect(JSON.parse(responseText)).toEqual({
      Msg: 'successfully added',
      ID: expectedId,
    });
  });

  test('TC-02 rejects adding the same book twice', async ({ request }) => {
    const response = await test.step('POST the same book again', () =>
      request.post(endpoint, {
        headers: { 'Content-Type': 'application/json' },
        data: book,
      }),
    );

    const responseText = await response.text();
    expect(response.status(), `API response body: ${responseText}`).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');
    expect(JSON.parse(responseText)).toEqual({
      Msg: 'Book Already Exists',
      ID: expectedId,
    });
  });
});
