import type { Pool, PoolClient } from "pg";

import type {
  ParsedAllureAttachment,
  ParsedAllureParameter,
  ParsedAllureResult,
  ParsedAllureRun,
  ParsedAllureStep,
} from "../types/parsed.types";
import type { ParsedAllureMetadata } from "../parsers/allure-metadata.parser";
import { ALLURE_POSTGRES_SCHEMA } from "./allure-postgres.schema";

export interface AllureInsertResult {
  runId: number;
  testCount: number;
}

export interface AllureReportAttachment {
  id: number;
  name: string;
  type: string | null;
  sizeBytes: number | null;
  data: Buffer | null;
}

export interface AllureReportParameter {
  name: string;
  value: string | null;
  exclude: boolean;
  mode: string | null;
}

export interface AllureReportLabel {
  name: string;
  value: string | null;
}

export interface AllureReportLink {
  name: string | null;
  type: string | null;
  url: string | null;
}

export interface AllureReportStep {
  id: number;
  stepOrder: number;
  description: string;
  uuid: string;
  status: string | null;
  statusDetails: unknown;
  stage: string | null;
  start: string | null;
  stop: string | null;
  parameters: AllureReportParameter[];
  attachments: AllureReportAttachment[];
  steps: AllureReportStep[];
}

export interface AllureReportTestCase {
  id: number;
  uuid: string;
  name: string;
  status: string | null;
  statusDetails: unknown;
  stage: string | null;
  historyId: string | null;
  start: string | null;
  stop: string | null;
  fullName: string | null;
  titlePath: string[] | null;
  parameters: AllureReportParameter[];
  labels: AllureReportLabel[];
  links: AllureReportLink[];
  attachments: AllureReportAttachment[];
  steps: AllureReportStep[];
}

export interface AllureDatabaseReport {
  id: number;
  environment: string | null;
  channel: string | null;
  runDate: string | null;
  totalTest: number;
  passed: number;
  failed: number;
  broken: number;
  skipped: number;
  unknown: number;
  duration: string | null;
  environmentProperties: Record<string, string>;
  categories: Array<Record<string, unknown>>;
  executor: Record<string, unknown> | null;
  history: Record<string, unknown>;
  tests: AllureReportTestCase[];
}

export class AllurePostgresRepository {
  constructor(private readonly pool: Pool) {}

  async readReport(runId?: number): Promise<AllureDatabaseReport | null> {
    if (runId !== undefined && (!Number.isSafeInteger(runId) || runId < 1)) {
      throw new Error("Allure run id must be a positive safe integer.");
    }

    const runResult = runId === undefined
      ? await this.pool.query<AllureDatabaseReport>(
          `SELECT id, environment, channel, run_date AS "runDate",
                  total_test AS "totalTest", passed, failed, broken, skipped, unknown, duration
           FROM test_runs
           ORDER BY id DESC
           LIMIT 1`,
        )
      : await this.pool.query<AllureDatabaseReport>(
          `SELECT id, environment, channel, run_date AS "runDate",
                  total_test AS "totalTest", passed, failed, broken, skipped, unknown, duration
           FROM test_runs
           WHERE id = $1`,
          [runId],
        );

    const run = runResult.rows[0];
    if (!run) {
      return null;
    }

    const [environmentResult, categoryResult, executorResult, historyResult] =
      await Promise.all([
        this.pool.query<{ name: string; value: string | null }>(
          `SELECT name, value FROM test_run_environment WHERE run_id = $1 ORDER BY id`,
          [run.id],
        ),
        this.pool.query<{ data: Record<string, unknown> }>(
          `SELECT data FROM test_run_categories WHERE run_id = $1 ORDER BY category_order`,
          [run.id],
        ),
        this.pool.query<{ data: Record<string, unknown> }>(
          `SELECT data FROM test_run_executor WHERE run_id = $1`,
          [run.id],
        ),
        this.pool.query<{ fileName: string; data: unknown }>(
          `SELECT file_name AS "fileName", data
           FROM test_run_history WHERE run_id = $1 ORDER BY file_name`,
          [run.id],
        ),
      ]);
    const metadata = {
      environmentProperties: Object.fromEntries(
        environmentResult.rows.map(({ name, value }) => [name, value ?? ""]),
      ),
      categories: categoryResult.rows.map((row) => row.data),
      executor: executorResult.rows[0]?.data ?? null,
      history: Object.fromEntries(
        historyResult.rows.map(({ fileName, data }) => [fileName, data]),
      ),
    };

    const testResult = await this.pool.query<Omit<AllureReportTestCase,
      "parameters" | "labels" | "links" | "attachments" | "steps">>(
      `SELECT id, uuid, name, status, status_details AS "statusDetails", stage,
              history_id AS "historyId", start, stop, full_name AS "fullName",
              title_path AS "titlePath"
       FROM test_cases
       WHERE run_id = $1
       ORDER BY start NULLS LAST, id`,
      [run.id],
    );
    const tests = testResult.rows;
    const testIds = tests.map((item) => item.id);

    if (testIds.length === 0) {
      return { ...run, ...metadata, tests: [] };
    }

    const [parameterResult, labelResult, linkResult, attachmentResult, stepResult] =
      await Promise.all([
        this.pool.query<AllureReportParameter & { testId: number }>(
          `SELECT test_id AS "testId", name, value, exclude, mode
           FROM test_parameters WHERE test_id = ANY($1::integer[]) ORDER BY id`,
          [testIds],
        ),
        this.pool.query<AllureReportLabel & { testId: number }>(
          `SELECT test_id AS "testId", name, value
           FROM test_labels WHERE test_id = ANY($1::integer[]) ORDER BY id`,
          [testIds],
        ),
        this.pool.query<AllureReportLink & { testId: number }>(
          `SELECT test_id AS "testId", name, type, url
           FROM test_links WHERE test_id = ANY($1::integer[]) ORDER BY id`,
          [testIds],
        ),
        this.pool.query<AllureReportAttachment & { testId: number }>(
          `SELECT id, test_id AS "testId", name, type, octet_length(data) AS "sizeBytes", data
           FROM test_attachments WHERE test_id = ANY($1::integer[]) ORDER BY id`,
          [testIds],
        ),
        this.pool.query<AllureReportStep & { testId: number; parentStepId: number | null }>(
          `SELECT id, test_id AS "testId", step_order AS "stepOrder", description,
                  parent_step_id AS "parentStepId", uuid, status,
                  status_details AS "statusDetails", stage, start, stop
           FROM test_steps WHERE test_id = ANY($1::integer[])
           ORDER BY test_id, parent_step_id NULLS FIRST, step_order, id`,
          [testIds],
        ),
      ]);

    const stepIds = stepResult.rows.map((step) => step.id);
    const [stepParameterResult, stepAttachmentResult] = stepIds.length > 0
      ? await Promise.all([
          this.pool.query<AllureReportParameter & { stepId: number }>(
            `SELECT step_id AS "stepId", name, value, exclude, mode
             FROM step_parameters WHERE step_id = ANY($1::integer[]) ORDER BY id`,
            [stepIds],
          ),
          this.pool.query<AllureReportAttachment & { stepId: number }>(
            `SELECT id, step_id AS "stepId", name, type, octet_length(data) AS "sizeBytes", data
             FROM step_attachments WHERE step_id = ANY($1::integer[]) ORDER BY id`,
            [stepIds],
          ),
        ])
      : [{ rows: [] }, { rows: [] }];

    const parametersByTest = this.groupBy(parameterResult.rows, (item) => item.testId);
    const labelsByTest = this.groupBy(labelResult.rows, (item) => item.testId);
    const linksByTest = this.groupBy(linkResult.rows, (item) => item.testId);
    const attachmentsByTest = this.groupBy(attachmentResult.rows, (item) => item.testId);
    const parametersByStep = this.groupBy(stepParameterResult.rows, (item) => item.stepId);
    const attachmentsByStep = this.groupBy(stepAttachmentResult.rows, (item) => item.stepId);
    const stepsByTest = this.groupBy(stepResult.rows, (item) => item.testId);

    return {
      ...run,
      ...metadata,
      tests: tests.map((item) => {
        const testSteps = stepsByTest.get(item.id) ?? [];
        const stepsByParent = this.groupBy(testSteps, (step) => step.parentStepId);
        const buildSteps = (parentId: number | null): AllureReportStep[] =>
          (stepsByParent.get(parentId) ?? []).map((step) => ({
            id: step.id,
            stepOrder: step.stepOrder,
            description: step.description,
            uuid: step.uuid,
            status: step.status,
            statusDetails: step.statusDetails,
            stage: step.stage,
            start: step.start,
            stop: step.stop,
            parameters: (parametersByStep.get(step.id) ?? []).map(
              ({ name, value, exclude, mode }) => ({ name, value, exclude, mode }),
            ),
            attachments: (attachmentsByStep.get(step.id) ?? []).map(
              ({ id, name, type, sizeBytes, data }) => ({ id, name, type, sizeBytes, data }),
            ),
            steps: buildSteps(step.id),
          }));

        return {
          ...item,
          parameters: (parametersByTest.get(item.id) ?? []).map(
            ({ name, value, exclude, mode }) => ({ name, value, exclude, mode }),
          ),
          labels: (labelsByTest.get(item.id) ?? []).map(
            ({ name, value }) => ({ name, value }),
          ),
          links: (linksByTest.get(item.id) ?? []).map(
            ({ name, type, url }) => ({ name, type, url }),
          ),
          attachments: (attachmentsByTest.get(item.id) ?? []).map(
            ({ id, name, type, sizeBytes, data }) => ({ id, name, type, sizeBytes, data }),
          ),
          steps: buildSteps(null),
        };
      }),
    };
  }

  private groupBy<T, K>(items: T[], getKey: (item: T) => K): Map<K, T[]> {
    const grouped = new Map<K, T[]>();
    for (const item of items) {
      const key = getKey(item);
      const group = grouped.get(key);
      if (group) {
        group.push(item);
      } else {
        grouped.set(key, [item]);
      }
    }
    return grouped;
  }

  async insertRun(
    run: ParsedAllureRun,
    results: ParsedAllureResult[],
    metadata?: ParsedAllureMetadata,
  ): Promise<AllureInsertResult> {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");

      for (const statement of ALLURE_POSTGRES_SCHEMA) {
        await client.query(statement);
      }

      const runInsert = await client.query<{ id: number }>(
        `INSERT INTO test_runs
          (environment, channel, run_date, total_test, passed, failed, broken, skipped, unknown, duration)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id`,
        [
          run.environment,
          run.channel,
          run.runDate,
          run.totalTest,
          run.passed,
          run.failed,
          run.broken,
          run.skipped,
          run.unknown,
          run.duration,
        ],
      );
      const runId = runInsert.rows[0]?.id;

      if (runId == null) {
        throw new Error("PostgreSQL did not return an id for the Allure test run.");
      }

      if (metadata) {
        await this.insertMetadata(client, runId, metadata);
      }

      for (const result of results) {
        await this.insertTestCase(client, runId, result);
      }

      await client.query("COMMIT");
      return { runId, testCount: results.length };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  private async insertMetadata(
    client: PoolClient,
    runId: number,
    metadata: ParsedAllureMetadata,
  ): Promise<void> {
    for (const [name, value] of Object.entries(metadata.environment)) {
      await client.query(
        `INSERT INTO test_run_environment (run_id, name, value) VALUES ($1, $2, $3)`,
        [runId, name, value],
      );
    }

    for (const [categoryOrder, category] of metadata.categories.entries()) {
      await client.query(
        `INSERT INTO test_run_categories (run_id, category_order, name, data)
         VALUES ($1, $2, $3, $4)`,
        [runId, categoryOrder, category.name, JSON.stringify(category)],
      );
    }

    if (metadata.executor) {
      await client.query(
        `INSERT INTO test_run_executor (run_id, data) VALUES ($1, $2)`,
        [runId, JSON.stringify(metadata.executor)],
      );
    }

    for (const [fileName, data] of Object.entries(metadata.history)) {
      await client.query(
        `INSERT INTO test_run_history (run_id, file_name, data) VALUES ($1, $2, $3)`,
        [runId, fileName, JSON.stringify(data)],
      );
    }
  }

  private async insertTestCase(
    client: PoolClient,
    runId: number,
    result: ParsedAllureResult,
  ): Promise<void> {
    const inserted = await client.query<{ id: number }>(
      `INSERT INTO test_cases
        (run_id, uuid, name, status, status_details, stage, history_id, start, stop,
         test_case_id, full_name, title_path)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id`,
      [
        runId,
        result.uuid,
        result.name,
        result.status ?? null,
        result.statusDetails ?? null,
        result.stage ?? null,
        result.historyId ?? null,
        result.start ?? null,
        result.stop ?? null,
        result.testCaseId ?? null,
        result.fullName ?? null,
        result.titlePath ?? null,
      ],
    );
    const testId = inserted.rows[0]?.id;

    if (testId == null) {
      throw new Error(`PostgreSQL did not return an id for Allure test "${result.uuid}".`);
    }

    await this.insertParameters(client, "test_parameters", "test_id", testId, result.parameters);

    for (const label of result.labels) {
      await client.query(
        "INSERT INTO test_labels (test_id, name, value) VALUES ($1, $2, $3)",
        [testId, label.name, label.value],
      );
    }

    for (const link of result.links) {
      await client.query(
        "INSERT INTO test_links (test_id, name, type, url) VALUES ($1, $2, $3, $4)",
        [testId, link.name, link.type, link.url],
      );
    }

    await this.insertAttachments(client, "test_attachments", "test_id", testId, result.attachments);

    for (const step of result.steps) {
      await this.insertStep(client, testId, step, null);
    }
  }

  private async insertStep(
    client: PoolClient,
    testId: number,
    step: ParsedAllureStep,
    parentStepId: number | null,
  ): Promise<void> {
    const inserted = await client.query<{ id: number }>(
      `INSERT INTO test_steps
        (test_id, step_order, description, parent_step_id, uuid, status, status_details, stage, start, stop)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id`,
      [
        testId,
        step.stepOrder,
        step.description,
        parentStepId,
        step.uuid,
        step.status ?? null,
        step.statusDetails ?? null,
        step.stage ?? null,
        step.start ?? null,
        step.stop ?? null,
      ],
    );
    const stepId = inserted.rows[0]?.id;

    if (stepId == null) {
      throw new Error(`PostgreSQL did not return an id for Allure step "${step.description}".`);
    }

    await this.insertParameters(client, "step_parameters", "step_id", stepId, step.parameters);
    await this.insertAttachments(client, "step_attachments", "step_id", stepId, step.attachments);

    for (const child of step.steps) {
      await this.insertStep(client, testId, child, stepId);
    }
  }

  private async insertParameters(
    client: PoolClient,
    table: "test_parameters" | "step_parameters",
    foreignKey: "test_id" | "step_id",
    parentId: number,
    parameters: ParsedAllureParameter[],
  ): Promise<void> {
    for (const parameter of parameters) {
      await client.query(
        `INSERT INTO ${table} (${foreignKey}, name, value, exclude, mode)
         VALUES ($1, $2, $3, $4, $5)`,
        [parentId, parameter.name, parameter.value, parameter.exclude, parameter.mode],
      );
    }
  }

  private async insertAttachments(
    client: PoolClient,
    table: "test_attachments" | "step_attachments",
    foreignKey: "test_id" | "step_id",
    parentId: number,
    attachments: ParsedAllureAttachment[],
  ): Promise<void> {
    for (const attachment of attachments) {
      await client.query(
        `INSERT INTO ${table} (${foreignKey}, name, type, data) VALUES ($1, $2, $3, $4)`,
        [parentId, attachment.name, attachment.type ?? null, attachment.data],
      );
    }
  }
}
