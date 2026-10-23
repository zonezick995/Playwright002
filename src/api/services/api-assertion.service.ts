import { expect, test } from '@playwright/test';
import { Logger } from '../../Helper/utils/logger';
import type {
  ApiAssertOptions,
  ApiFieldType,
  ApiResponse,
} from '../models/api-response.model';

const getFieldType = (value: unknown): ApiFieldType | 'undefined' => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  return typeof value as ApiFieldType | 'undefined';
};

const logAssertionFailure = (message: string, error: unknown) => {
  Logger.error('API', `Assertion failed: ${message}`, error);
};

const assertWithAllure = async <T>(
  stepName: string,
  details: Record<string, unknown>,
  assertion: () => T | Promise<T>,
): Promise<T> =>
  test.step(stepName, async () => {
    let outcome: 'passed' | 'failed' = 'passed';

    try {
      return await assertion();
    } catch (error) {
      outcome = 'failed';
      throw error;
    } finally {
      await test.info().attach('Assertion details', {
        body: JSON.stringify({ ...details, outcome }, null, 2),
        contentType: 'application/json',
      });
    }
  });

export const assertStatusCode = async (
  response: ApiResponse,
  expectedStatusCode: number,
) => {
  Logger.info(
    'API',
    `Assert status code: expected [${expectedStatusCode}] , received [${response.statusCode}]`,
  );
  try {
    await assertWithAllure(
      'Assert API status code is a number',
      {
        assertion: 'status-code-type',
        expectedType: 'number',
        actualType: typeof response.statusCode,
      },
      () => expect(typeof response.statusCode).toBe('number'),
    );
    await assertWithAllure(
      `Assert API status code is ${expectedStatusCode}`,
      {
        assertion: 'status-code-value',
        expectedStatusCode,
        actualStatusCode: response.statusCode,
      },
      () => expect(response.statusCode).toBe(expectedStatusCode),
    );
  } catch (error) {
    logAssertionFailure(
      `status code assertion failed; expected ${expectedStatusCode}, received type ${typeof response.statusCode}`,
      error,
    );
    throw error;
  }
};

export const assertBodyArray = async <T = unknown>(
  body: unknown,
): Promise<T[]> => {
  const bodyType = getFieldType(body);
  Logger.info('API', 'Assert response body is a non-empty array');
  try {
    await assertWithAllure(
      'Assert response body is not null',
      { assertion: 'body-not-null', actualType: bodyType },
      () => expect(body).not.toBeNull(),
    );
    await assertWithAllure(
      'Assert response body is an array',
      {
        assertion: 'body-array-type',
        expectedType: 'array',
        actualType: bodyType,
      },
      () => expect(Array.isArray(body)).toBe(true),
    );

    const bodyArray = body as unknown[];
    await assertWithAllure(
      'Assert response body array is not empty',
      {
        assertion: 'body-array-length',
        expectedMinimumLength: 1,
        actualLength: bodyArray.length,
      },
      () => expect(bodyArray.length).toBeGreaterThan(0),
    );
    return bodyArray as T[];
  } catch (error) {
    logAssertionFailure(
      `response body array assertion failed; received type ${bodyType}`,
      error,
    );
    throw error;
  }
};

export const assertBodyObject = async (
  body: unknown,
): Promise<Record<string, unknown>> => {
  const bodyType = getFieldType(body);
  Logger.info('API', 'Assert response body is a non-empty object');
  try {
    await assertWithAllure(
      'Assert response body is not null',
      { assertion: 'body-not-null', actualType: bodyType },
      () => expect(body).not.toBeNull(),
    );
    await assertWithAllure(
      'Assert response body is not an array',
      { assertion: 'body-not-array', actualType: bodyType },
      () => expect(Array.isArray(body)).toBe(false),
    );
    await assertWithAllure(
      'Assert response body has object type',
      {
        assertion: 'body-object-type',
        expectedType: 'object',
        actualType: typeof body,
      },
      () => expect(typeof body).toBe('object'),
    );

    const bodyObject = body as Record<string, unknown>;
    await assertWithAllure(
      'Assert response body object is not empty',
      {
        assertion: 'body-object-keys',
        expectedMinimumKeyCount: 1,
        actualKeyCount: Object.keys(bodyObject).length,
      },
      () => expect(Object.keys(bodyObject)).not.toHaveLength(0),
    );
    return bodyObject;
  } catch (error) {
    logAssertionFailure(
      `response body object assertion failed; received type ${bodyType}`,
      error,
    );
    throw error;
  }
};

export const assertFieldType = async (
  body: Record<string, unknown>,
  fieldName: string,
  expectedType: ApiFieldType,
) => {
  const actualType = getFieldType(body[fieldName]);
  Logger.info(
    'API',
    `Assert field type: ${fieldName} expected ${expectedType}, received ${actualType}`,
  );
  try {
    await assertWithAllure(
      `Assert field ${fieldName} has type ${expectedType}`,
      {
        assertion: 'field-type',
        fieldName,
        expectedType,
        actualType,
      },
      () => expect(actualType).toBe(expectedType),
    );
  } catch (error) {
    logAssertionFailure(
      `field ${fieldName} type expected ${expectedType}, received ${actualType}`,
      error,
    );
    throw error;
  }
};

export const assertFieldValue = <T>(
  body: Record<string, unknown>,
  fieldName: string,
  expectedValue: T,
) =>
  assertWithAllure(
    `Assert field ${fieldName} has expected value`,
    {
      assertion: 'field-value',
      fieldName,
      expectedType: getFieldType(expectedValue),
      actualType: getFieldType(body[fieldName]),
    },
    async () => {
      Logger.info(
        'API',
        `Assert field value: ${fieldName}, expected type ${getFieldType(
          expectedValue,
        )}`,
      );
      try {
        expect(body[fieldName]).toBe(expectedValue);
      } catch (error) {
        logAssertionFailure(
          `field ${fieldName} value assertion failed; expected type ${getFieldType(
            expectedValue,
          )}, received type ${getFieldType(body[fieldName])}`,
          error,
        );
        throw error;
      }
    },
  );

export const assertApiResponse = async (
  response: ApiResponse,
  { statusCode, fieldTypes = {}, fieldValues = {} }: ApiAssertOptions,
) => {
  await assertStatusCode(response, statusCode);

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
