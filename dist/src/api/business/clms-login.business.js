"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginToClms = void 0;
const loginToClms = (api, baseUrl, credentials) => {
    return api.post(`${baseUrl}/login`, {
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-Channel': 'WEB',
            'X-Request-Id': crypto.randomUUID(),
        },
        body: {
            requestTrace: crypto.randomUUID(),
            requestDateTime: new Date().toISOString(),
            requestParameters: {
                username: ':user',
                password: ':pass',
            },
        },
        bodyParams: {
            user: credentials.username,
            pass: credentials.password,
        },
    });
};
exports.loginToClms = loginToClms;
