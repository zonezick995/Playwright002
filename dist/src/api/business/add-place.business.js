"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPlace = void 0;
const placePayload = {
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
};
const createPlace = async (api) => {
    const endpoint = process.env.BASE_API_URL_DEMO_ADD_PLACE;
    if (!endpoint) {
        throw new Error('BASE_API_URL_DEMO_ADD_PLACE must be configured');
    }
    return api.post(endpoint, {
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-Channel': 'WEB',
            'X-Request-Id': 'a396d04a-553e-4ea7-80b4-82eb75872e7d',
        },
        body: placePayload,
        returnResponse: true,
    });
};
exports.createPlace = createPlace;
