import { expect, test } from '@playwright/test';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { AllureMetadataParser } from '../../Helper/Allure';

test('parses Allure environment, categories, executor, and history artifacts', async () => {
  const resultsDir = await mkdtemp(path.join(os.tmpdir(), 'allure-metadata-'));

  try {
    await mkdir(path.join(resultsDir, 'history'));
    await Promise.all([
      writeFile(
        path.join(resultsDir, 'environment.properties'),
        '# run environment\nBrowser=chromium\nBuild\\ Number=42\n',
      ),
      writeFile(
        path.join(resultsDir, 'categories.json'),
        JSON.stringify([{ name: 'Product defects', matchedStatuses: ['failed'] }]),
      ),
      writeFile(
        path.join(resultsDir, 'executor.json'),
        JSON.stringify({ name: 'CI', type: 'jenkins', buildOrder: 42 }),
      ),
      writeFile(
        path.join(resultsDir, 'history', 'history-trend.json'),
        JSON.stringify([{ buildOrder: 41, data: { passed: 3, failed: 1 } }]),
      ),
    ]);

    const metadata = await new AllureMetadataParser(resultsDir).parse();

    expect(metadata.environment).toEqual({
      Browser: 'chromium',
      'Build Number': '42',
    });
    expect(metadata.categories).toEqual([
      { name: 'Product defects', matchedStatuses: ['failed'] },
    ]);
    expect(metadata.executor).toEqual({ name: 'CI', type: 'jenkins', buildOrder: 42 });
    expect(metadata.history['history-trend.json']).toEqual([
      { buildOrder: 41, data: { passed: 3, failed: 1 } },
    ]);
  } finally {
    await rm(resultsDir, { recursive: true, force: true });
  }
});
