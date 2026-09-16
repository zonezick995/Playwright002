import { expect, test } from '@playwright/test';
import { Logger } from './utils/logger';

export type ApiResponse<T = unknown> = {
  statusCode: number;
  body: T;
};

/** Supported runtime types for response body fields. */
export type ApiFieldType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null';

/** Assertion rules for an API response. */
export type ApiAssertOptions = {
  statusCode: number;
  fieldTypes?: Record<string, ApiFieldType>;
  fieldValues?: Record<string, unknown>;
};

const getFieldType = (value: unknown): ApiFieldType => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  return typeof value as ApiFieldType;
};

const formatValue = (value: unknown): string => {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const logAssertionFailure = (message: string, error: unknown) => {
  Logger.error('API', `Assertion failed: ${message}`, error);
};

export const assertStatusCode = async (
  response: ApiResponse,
  expectedStatusCode: number,
) => {
  await test.step(`Assert API status code is ${expectedStatusCode}`, async () => {
    Logger.info('API', `Assert status code: expected [${expectedStatusCode}] , received [${response.statusCode}]`);
    try {
      expect(typeof response.statusCode).toBe('number');
      expect(response.statusCode).toBe(expectedStatusCode);
    } catch (error) {
      logAssertionFailure(
        `status code expected ${expectedStatusCode}, received ${formatValue(response.statusCode)}`,
        error,
      );
      throw error;
    }
  });
};

/** Verifies that the response body is a non-empty array and returns it. */
export const assertBodyArray = async <T = unknown>(body: unknown): Promise<T[]> => {
  return test.step('Assert API response body is a non-empty array', async () => {
    Logger.info('API', 'Assert response body is a non-empty array');
    try {
      expect(body).not.toBeNull();
      expect(Array.isArray(body)).toBe(true);
      expect((body as unknown[]).length).toBeGreaterThan(0);
      return body as T[];
    } catch (error) {
      logAssertionFailure(`response body is not a non-empty array: ${formatValue(body)}`, error);
      throw error;
    }
  });
};

/** Verifies that the response body is a non-empty object and returns it. */
export const assertBodyObject = async (body: unknown): Promise<Record<string, unknown>> => {
  return test.step('Assert API response body is a non-empty object', async () => {
    Logger.info('API', 'Assert response body is a non-empty object');
    try {
      expect(body).not.toBeNull();
      expect(Array.isArray(body)).toBe(false);
      expect(typeof body).toBe('object');

      const bodyObject = body as Record<string, unknown>;
      expect(Object.keys(bodyObject)).not.toHaveLength(0);

      return bodyObject;
    } catch (error) {
      logAssertionFailure(`response body is not a non-empty object: ${formatValue(body)}`, error);
      throw error;
    }
  });
};

/** Verifies the runtime type of a response body field. */
export const assertFieldType = async (
  body: Record<string, unknown>,
  fieldName: string,
  expectedType: ApiFieldType,
) => {
  await test.step(`Assert field ${fieldName} has type ${expectedType}`, async () => {
    const actualType = getFieldType(body[fieldName]);
    Logger.info('API', `Assert field type: ${fieldName} expected ${expectedType}, received ${actualType}`);
    try {
      expect(actualType).toBe(expectedType);
    } catch (error) {
      logAssertionFailure(
        `field ${fieldName} type expected ${expectedType}, received ${actualType}; value: ${formatValue(body[fieldName])}`,
        error,
      );
      throw error;
    }
  });
};

/** Verifies the exact value of a response body field. */
export const assertFieldValue = <T>(
  body: Record<string, unknown>,
  fieldName: string,
  expectedValue: T,
) => test.step(`Assert field ${fieldName} has expected value`, async () => {
  Logger.info('API', `Assert field value: ${fieldName}, expected ${formatValue(expectedValue)}`);
  try {
    expect(body[fieldName]).toBe(expectedValue);
  } catch (error) {
    logAssertionFailure(
      `field ${fieldName} value expected ${formatValue(expectedValue)}, received ${formatValue(body[fieldName])}`,
      error,
    );
    throw error;
  }
});

/** Runs status, body shape, field type, and field value assertions together. */
export const assertApiResponse = async (
  response: ApiResponse,
  { statusCode, fieldTypes = {}, fieldValues = {} }: ApiAssertOptions,
) => {
  await test.step('Assert API response', async () => {
    await assertStatusCode(response, statusCode);
  });

  const body = Array.isArray(response.body)
    ? await assertBodyArray(response.body)
    : await assertBodyObject(response.body);

  if (Array.isArray(body)) {
    for (const item of body) {
      const objectItem = item as Record<string, unknown>;
      for (const [fieldName, expectedType] of Object.entries(fieldTypes)) {
        await assertFieldType(objectItem, fieldName, expectedType);
      }
      for (const [fieldName, expectedValue] of Object.entries(fieldValues)) {
        await assertFieldValue(objectItem, fieldName, expectedValue);
      }
    }
    return body;
  }

  for (const [fieldName, expectedType] of Object.entries(fieldTypes)) {
    await assertFieldType(body, fieldName, expectedType);
  }

  for (const [fieldName, expectedValue] of Object.entries(fieldValues)) {
    await assertFieldValue(body, fieldName, expectedValue);
  }

  return body;
};