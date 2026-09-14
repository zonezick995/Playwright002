import { expect, test } from '@playwright/test';
import { Logger } from './utils/logger';

export type ApiResponse<T = unknown> = {
  statusCode: number;
  body: T;
};

export type ApiFieldType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null';

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

export const assertStatusCode = async (
  response: ApiResponse,
  expectedStatusCode: number,
) => {
  await test.step(`Assert API status code is ${expectedStatusCode}`, async () => {
    Logger.info('API', `Assert status code: expected [${expectedStatusCode}] , received [${response.statusCode}]`);
    expect(typeof response.statusCode).toBe('number');
    expect(response.statusCode).toBe(expectedStatusCode);
  });
};

export const assertBodyObject = async (body: unknown): Promise<Record<string, unknown>> => {
  return test.step('Assert API response body is a non-empty object', async () => {
    Logger.info('API', 'Assert response body is a non-empty object');
    expect(body).not.toBeNull();
    expect(Array.isArray(body)).toBe(false);
    expect(typeof body).toBe('object');

    const bodyObject = body as Record<string, unknown>;
    expect(Object.keys(bodyObject)).not.toHaveLength(0);

    return bodyObject;
  });
};

export const assertFieldType = async (
  body: Record<string, unknown>,
  fieldName: string,
  expectedType: ApiFieldType,
) => {
  await test.step(`Assert field ${fieldName} has type ${expectedType}`, async () => {
    const actualType = getFieldType(body[fieldName]);
    Logger.info('API', `Assert field type: ${fieldName} expected ${expectedType}, received ${actualType}`);
    expect(actualType).toBe(expectedType);
  });
};

export const assertFieldValue = <T>(
  body: Record<string, unknown>,
  fieldName: string,
  expectedValue: T,
) => test.step(`Assert field ${fieldName} has expected value`, async () => {
  Logger.info('API', `Assert field value: ${fieldName}`);
  expect(body[fieldName]).toBe(expectedValue);
});

export const assertApiResponse = async (
  response: ApiResponse,
  { statusCode, fieldTypes = {}, fieldValues = {} }: ApiAssertOptions,
) => {
  await test.step('Assert API response', async () => {
    await assertStatusCode(response, statusCode);
  });
  const body = await assertBodyObject(response.body);

  for (const [fieldName, expectedType] of Object.entries(fieldTypes)) {
    await assertFieldType(body, fieldName, expectedType);
  }

  for (const [fieldName, expectedValue] of Object.entries(fieldValues)) {
    await assertFieldValue(body, fieldName, expectedValue);
  }

  return body;
};