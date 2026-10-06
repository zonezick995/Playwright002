import { expect, test } from '@playwright/test';
import path from 'node:path';

import {
  AllureMetadataParser,
  AllurePostgresRepository,
  AllureResultsParser,
  createAllurePostgresPool,
} from '../../Helper/Allure';

test('inserts parsed Allure results into PostgreSQL', async () => {
  const resultsDir = path.resolve(process.cwd(), 'allure-results');
  const parser = new AllureResultsParser(resultsDir, {
    environment: process.env.NODE_ENV,
    channel: process.env.ALLURE_CHANNEL,
  });
  const results = await parser.parse();
  const run = await parser.parseRun(results);
  const metadata = await new AllureMetadataParser(resultsDir).parse();
  const steps = results.flatMap((result) => result.steps);
  for (let index = 0; index < steps.length; index += 1) {
    steps.push(...steps[index].steps);
  }
  const expectedCounts = {
    steps: steps.length,
    stepParameters: steps.reduce((count, step) => count + step.parameters.length, 0),
    stepAttachments: steps.reduce((count, step) => count + step.attachments.length, 0),
    testParameters: results.reduce((count, result) => count + result.parameters.length, 0),
    labels: results.reduce((count, result) => count + result.labels.length, 0),
    links: results.reduce((count, result) => count + result.links.length, 0),
    testAttachments: results.reduce((count, result) => count + result.attachments.length, 0),
  };
  const pool = createAllurePostgresPool();

  try {
    const inserted = await new AllurePostgresRepository(pool).insertRun(run, results, metadata);
    const persisted = await pool.query<{
      database: string;
      current_user: string;
      run_count: string;
      test_count: string;
      step_count: string;
      step_parameter_count: string;
      step_attachment_count: string;
      test_parameter_count: string;
      label_count: string;
      link_count: string;
      test_attachment_count: string;
      environment_count: string;
      category_count: string;
      executor_count: string;
      history_file_count: string;
    }>(
      `SELECT current_database() AS database,
              current_user,
              (SELECT count(*) FROM test_runs WHERE id = $1) AS run_count,
              (SELECT count(*) FROM test_cases WHERE run_id = $1) AS test_count,
              (SELECT count(*) FROM test_steps s
               JOIN test_cases c ON c.id = s.test_id
               WHERE c.run_id = $1) AS step_count,
              (SELECT count(*) FROM step_parameters p
               JOIN test_steps s ON s.id = p.step_id
               JOIN test_cases c ON c.id = s.test_id
               WHERE c.run_id = $1) AS step_parameter_count,
              (SELECT count(*) FROM step_attachments a
               JOIN test_steps s ON s.id = a.step_id
               JOIN test_cases c ON c.id = s.test_id
               WHERE c.run_id = $1) AS step_attachment_count,
              (SELECT count(*) FROM test_parameters p
               JOIN test_cases c ON c.id = p.test_id
               WHERE c.run_id = $1) AS test_parameter_count,
              (SELECT count(*) FROM test_labels l
               JOIN test_cases c ON c.id = l.test_id
               WHERE c.run_id = $1) AS label_count,
              (SELECT count(*) FROM test_links l
               JOIN test_cases c ON c.id = l.test_id
               WHERE c.run_id = $1) AS link_count,
              (SELECT count(*) FROM test_attachments a
               JOIN test_cases c ON c.id = a.test_id
               WHERE c.run_id = $1) AS test_attachment_count,
              (SELECT count(*) FROM test_run_environment WHERE run_id = $1) AS environment_count,
              (SELECT count(*) FROM test_run_categories WHERE run_id = $1) AS category_count,
              (SELECT count(*) FROM test_run_executor WHERE run_id = $1) AS executor_count,
              (SELECT count(*) FROM test_run_history WHERE run_id = $1) AS history_file_count`,
      [inserted.runId],
    );

    expect(persisted.rows).toHaveLength(1);
    expect(persisted.rows[0].run_count).toBe('1');
    expect(Number(persisted.rows[0].test_count)).toBe(results.length);
    expect(Number(persisted.rows[0].step_count)).toBe(expectedCounts.steps);
    expect(Number(persisted.rows[0].step_parameter_count)).toBe(expectedCounts.stepParameters);
    expect(Number(persisted.rows[0].step_attachment_count)).toBe(expectedCounts.stepAttachments);
    expect(Number(persisted.rows[0].test_parameter_count)).toBe(expectedCounts.testParameters);
    expect(Number(persisted.rows[0].label_count)).toBe(expectedCounts.labels);
    expect(Number(persisted.rows[0].link_count)).toBe(expectedCounts.links);
    expect(Number(persisted.rows[0].test_attachment_count)).toBe(expectedCounts.testAttachments);
    expect(Number(persisted.rows[0].environment_count)).toBe(Object.keys(metadata.environment).length);
    expect(Number(persisted.rows[0].category_count)).toBe(metadata.categories.length);
    expect(Number(persisted.rows[0].executor_count)).toBe(metadata.executor ? 1 : 0);
    expect(Number(persisted.rows[0].history_file_count)).toBe(Object.keys(metadata.history).length);
    expect(inserted.testCount).toBe(results.length);
    console.log('[Allure PostgreSQL] Imported:', {
      ...persisted.rows[0],
      runId: inserted.runId,
      testCount: inserted.testCount,
      parsedCounts: expectedCounts,
      metadataCounts: {
        environment: Object.keys(metadata.environment).length,
        categories: metadata.categories.length,
        executor: metadata.executor ? 1 : 0,
        historyFiles: Object.keys(metadata.history).length,
      },
    });
  } finally {
    await pool.end();
  }
});
