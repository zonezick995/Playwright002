import { expect, test } from '@playwright/test';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import {
  AllureMetadataParser,
  AllurePostgresReportGenerator,
  AllurePostgresRepository,
  AllureResultsParser,
  createAllurePostgresPool,
} from '../../Helper/Allure';

test('persists Allure run metadata and restores it for report generation', async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'allure-postgres-metadata-'));
  const resultsDir = path.join(tempRoot, 'allure-results');
  const outputDir = path.join(tempRoot, 'reports');
  const testUuid = '5db56316-8b21-4c07-a7cc-3d33a7baecf8';
  const pool = createAllurePostgresPool();

  try {
    await mkdir(path.join(resultsDir, 'history'), { recursive: true });
    await Promise.all([
      writeFile(
        path.join(resultsDir, `${testUuid}-result.json`),
        JSON.stringify({
          uuid: testUuid,
          name: 'metadata database integration',
          status: 'passed',
          stage: 'finished',
          start: 1700000000000,
          stop: 1700000000100,
          labels: [],
          parameters: [],
          steps: [],
          attachments: [],
          links: [],
        }),
      ),
      writeFile(path.join(resultsDir, 'environment.properties'), 'Browser=chromium\n'),
      writeFile(
        path.join(resultsDir, 'categories.json'),
        JSON.stringify([{ name: 'Product defects', matchedStatuses: ['failed'] }]),
      ),
      writeFile(
        path.join(resultsDir, 'executor.json'),
        JSON.stringify({ name: 'Local CI', type: 'local', buildOrder: 19 }),
      ),
      writeFile(
        path.join(resultsDir, 'history', 'history-trend.json'),
        JSON.stringify([{ buildOrder: 18, data: { passed: 2, failed: 1 } }]),
      ),
    ]);

    const resultsParser = new AllureResultsParser(resultsDir);
    const results = await resultsParser.parse();
    const run = await resultsParser.parseRun(results);
    const metadata = await new AllureMetadataParser(resultsDir).parse();
    const repository = new AllurePostgresRepository(pool);
    const inserted = await repository.insertRun(run, results, metadata);
    const stored = await repository.readReport(inserted.runId);

    expect(stored).not.toBeNull();
    expect(stored?.environmentProperties).toEqual({ Browser: 'chromium' });
    expect(stored?.categories).toEqual([
      { name: 'Product defects', matchedStatuses: ['failed'] },
    ]);
    expect(stored?.executor).toEqual({ name: 'Local CI', type: 'local', buildOrder: 19 });
    expect(stored?.history['history-trend.json']).toEqual([
      { buildOrder: 18, data: { passed: 2, failed: 1 } },
    ]);

    const generated = await new AllurePostgresReportGenerator(
      repository,
      outputDir,
    ).generate(inserted.runId);
    expect(await readFile(path.join(generated.resultsDir, 'environment.properties'), 'utf8'))
      .toContain('Browser=chromium');
    expect(JSON.parse(await readFile(path.join(generated.resultsDir, 'categories.json'), 'utf8')))
      .toEqual(metadata.categories);
    expect(JSON.parse(await readFile(path.join(generated.resultsDir, 'executor.json'), 'utf8')))
      .toEqual(metadata.executor);
    expect(JSON.parse(
      await readFile(path.join(generated.resultsDir, 'history', 'history-trend.json'), 'utf8'),
    )).toEqual(metadata.history['history-trend.json']);
    expect(await readFile(generated.filePath, 'utf8')).toContain('<html');
  } finally {
    await pool.end();
    await rm(tempRoot, { recursive: true, force: true });
  }
});
