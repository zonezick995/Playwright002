import { expect, test } from '@playwright/test';
import path from 'node:path';

import { AllureResultsParser } from '../../Helper/Allure';

test('prints parsed Allure values for database inspection', async () => {
  const resultsDir = path.resolve(process.cwd(), 'allure-results');
  const parser = new AllureResultsParser(resultsDir, {
    environment: process.env.NODE_ENV,
    channel: process.env.ALLURE_CHANNEL,
  });
  const results = await parser.parse();
  const run = await parser.parseRun(results);

  console.log(`[Allure Parser] Parsed ${results.length} result file(s).`);
  console.log('[Allure Parser] test_runs values:', JSON.stringify(run, null, 2));
  console.log(
    '[Allure Parser] Per-test and child-table values:',
    JSON.stringify(
      results,
      (key, value: unknown) => {
        if (
          key === 'data' &&
          typeof value === 'object' &&
          value !== null &&
          'type' in value &&
          value.type === 'Buffer' &&
          'data' in value &&
          Array.isArray(value.data)
        ) {
          return `<Buffer ${value.data.length} bytes>`;
        }

        return value;
      },
      2,
    ),
  );

  expect(run.totalTest).toBe(results.length);
  expect(run.passed + run.failed + run.broken + run.skipped + run.unknown).toBe(results.length);
});
