"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_fixtures_1 = require("../../src/fixtures/api.fixtures");
const api_1 = require("../../src/api");
api_fixtures_1.test.describe('Add Place API', () => {
    (0, api_fixtures_1.test)('creates a place successfully', async ({ api }) => {
        const response = await (0, api_1.createPlace)(api);
        await (0, api_1.assertApiResponse)(response, {
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
