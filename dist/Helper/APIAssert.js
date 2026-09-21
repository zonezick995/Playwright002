"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertApiResponse = exports.assertFieldValue = exports.assertFieldType = exports.assertBodyObject = exports.assertBodyArray = exports.assertStatusCode = void 0;
const test_1 = require("@playwright/test");
const logger_1 = require("./utils/logger");
const getFieldType = (value) => {
    if (value === null)
        return 'null';
    if (Array.isArray(value))
        return 'array';
    if (typeof value === 'object')
        return 'object';
    return typeof value;
};
const formatValue = (value) => {
    try {
        return JSON.stringify(value);
    }
    catch {
        return String(value);
    }
};
const logAssertionFailure = (message, error) => {
    logger_1.Logger.error('API', `Assertion failed: ${message}`, error);
};
const assertStatusCode = async (response, expectedStatusCode) => {
    await test_1.test.step(`Assert API status code is ${expectedStatusCode}`, async () => {
        logger_1.Logger.info('API', `Assert status code: expected [${expectedStatusCode}] , received [${response.statusCode}]`);
        try {
            (0, test_1.expect)(typeof response.statusCode).toBe('number');
            (0, test_1.expect)(response.statusCode).toBe(expectedStatusCode);
        }
        catch (error) {
            logAssertionFailure(`status code expected ${expectedStatusCode}, received ${formatValue(response.statusCode)}`, error);
            throw error;
        }
    });
};
exports.assertStatusCode = assertStatusCode;
/** Verifies that the response body is a non-empty array and returns it. */
const assertBodyArray = async (body) => {
    return test_1.test.step('Assert API response body is a non-empty array', async () => {
        logger_1.Logger.info('API', 'Assert response body is a non-empty array');
        try {
            (0, test_1.expect)(body).not.toBeNull();
            (0, test_1.expect)(Array.isArray(body)).toBe(true);
            (0, test_1.expect)(body.length).toBeGreaterThan(0);
            return body;
        }
        catch (error) {
            logAssertionFailure(`response body is not a non-empty array: ${formatValue(body)}`, error);
            throw error;
        }
    });
};
exports.assertBodyArray = assertBodyArray;
/** Verifies that the response body is a non-empty object and returns it. */
const assertBodyObject = async (body) => {
    return test_1.test.step('Assert API response body is a non-empty object', async () => {
        logger_1.Logger.info('API', 'Assert response body is a non-empty object');
        try {
            (0, test_1.expect)(body).not.toBeNull();
            (0, test_1.expect)(Array.isArray(body)).toBe(false);
            (0, test_1.expect)(typeof body).toBe('object');
            const bodyObject = body;
            (0, test_1.expect)(Object.keys(bodyObject)).not.toHaveLength(0);
            return bodyObject;
        }
        catch (error) {
            logAssertionFailure(`response body is not a non-empty object: ${formatValue(body)}`, error);
            throw error;
        }
    });
};
exports.assertBodyObject = assertBodyObject;
/** Verifies the runtime type of a response body field. */
const assertFieldType = async (body, fieldName, expectedType) => {
    await test_1.test.step(`Assert field ${fieldName} has type ${expectedType}`, async () => {
        const actualType = getFieldType(body[fieldName]);
        logger_1.Logger.info('API', `Assert field type: ${fieldName} expected ${expectedType}, received ${actualType}`);
        try {
            (0, test_1.expect)(actualType).toBe(expectedType);
        }
        catch (error) {
            logAssertionFailure(`field ${fieldName} type expected ${expectedType}, received ${actualType}; value: ${formatValue(body[fieldName])}`, error);
            throw error;
        }
    });
};
exports.assertFieldType = assertFieldType;
/** Verifies the exact value of a response body field. */
const assertFieldValue = (body, fieldName, expectedValue) => test_1.test.step(`Assert field ${fieldName} has expected value`, async () => {
    logger_1.Logger.info('API', `Assert field value: ${fieldName}, expected ${formatValue(expectedValue)}`);
    try {
        (0, test_1.expect)(body[fieldName]).toBe(expectedValue);
    }
    catch (error) {
        logAssertionFailure(`field ${fieldName} value expected ${formatValue(expectedValue)}, received ${formatValue(body[fieldName])}`, error);
        throw error;
    }
});
exports.assertFieldValue = assertFieldValue;
/** Runs status, body shape, field type, and field value assertions together. */
const assertApiResponse = async (response, { statusCode, fieldTypes = {}, fieldValues = {} }) => {
    await test_1.test.step('Assert API response', async () => {
        await (0, exports.assertStatusCode)(response, statusCode);
    });
    const body = Array.isArray(response.body)
        ? await (0, exports.assertBodyArray)(response.body)
        : await (0, exports.assertBodyObject)(response.body);
    if (Array.isArray(body)) {
        for (const item of body) {
            const objectItem = item;
            for (const [fieldName, expectedType] of Object.entries(fieldTypes)) {
                await (0, exports.assertFieldType)(objectItem, fieldName, expectedType);
            }
            for (const [fieldName, expectedValue] of Object.entries(fieldValues)) {
                await (0, exports.assertFieldValue)(objectItem, fieldName, expectedValue);
            }
        }
        return body;
    }
    for (const [fieldName, expectedType] of Object.entries(fieldTypes)) {
        await (0, exports.assertFieldType)(body, fieldName, expectedType);
    }
    for (const [fieldName, expectedValue] of Object.entries(fieldValues)) {
        await (0, exports.assertFieldValue)(body, fieldName, expectedValue);
    }
    return body;
};
exports.assertApiResponse = assertApiResponse;
