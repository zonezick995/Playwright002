import { test } from '../../fixtures/api.fixtures';
import { assertApiResponse, createPlace } from '../../api';

test.describe('Add Place API', () => {
  test('creates a place successfully', async ({ api }) => {
    const response = await createPlace(api);

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
  });
});
