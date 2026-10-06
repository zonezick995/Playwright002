import { expect, test } from '@playwright/test';
import { access, readFile, readdir } from 'node:fs/promises';

import {
  AllurePostgresReportGenerator,
  AllurePostgresRepository,
  createAllurePostgresPool,
} from '../../Helper/Allure';

test('generates an HTML report from the latest PostgreSQL Allure run', async () => {
  const configuredRunId = process.env.ALLURE_RUN_ID?.trim();
  const runId = configuredRunId ? Number(configuredRunId) : undefined;
  if (runId !== undefined && (!Number.isSafeInteger(runId) || runId < 1)) {
    throw new Error('ALLURE_RUN_ID must be a positive integer.');
  }

  const pool = createAllurePostgresPool();

  try {
    const repository = new AllurePostgresRepository(pool);
    const run = await repository.readReport(runId);
    if (!run) {
      throw new Error(
        runId
          ? `Allure run ${runId} should exist in PostgreSQL.`
          : 'No Allure run was found in PostgreSQL.',
      );
    }

    const generated = await new AllurePostgresReportGenerator(repository).generate(runId);
    await access(generated.filePath);
    const resultFiles = (await readdir(generated.resultsDir))
      .filter((file) => file.endsWith('-result.json'));

    expect(generated.runId).toBe(run.id);
    expect(generated.testCount).toBe(run.tests.length);
    expect(resultFiles).toHaveLength(run.tests.length);
    expect(await readFile(generated.filePath, 'utf8')).toContain('<html');

    console.log('[Allure PostgreSQL Report] Generated:', {
      runId: generated.runId,
      testCount: generated.testCount,
      reportDir: generated.reportDir,
      filePath: generated.filePath,
    });
  } finally {
    await pool.end();
  }
});
