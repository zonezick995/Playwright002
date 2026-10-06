"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALLURE_POSTGRES_SCHEMA = void 0;
exports.ALLURE_POSTGRES_SCHEMA = [
    `CREATE TABLE IF NOT EXISTS test_runs (
    id serial PRIMARY KEY,
    environment varchar(200),
    channel varchar(20),
    run_date bigint,
    total_test integer NOT NULL DEFAULT 0,
    passed integer NOT NULL DEFAULT 0,
    failed integer NOT NULL DEFAULT 0,
    broken integer NOT NULL DEFAULT 0,
    skipped integer NOT NULL DEFAULT 0,
    unknown integer NOT NULL DEFAULT 0,
    duration bigint
  )`,
    `CREATE TABLE IF NOT EXISTS test_run_environment (
    id serial PRIMARY KEY,
    run_id integer NOT NULL REFERENCES test_runs(id) ON DELETE CASCADE,
    name text NOT NULL,
    value text
  )`,
    `CREATE TABLE IF NOT EXISTS test_run_categories (
    id serial PRIMARY KEY,
    run_id integer NOT NULL REFERENCES test_runs(id) ON DELETE CASCADE,
    category_order integer NOT NULL,
    name text NOT NULL,
    data jsonb NOT NULL
  )`,
    `CREATE TABLE IF NOT EXISTS test_run_executor (
    run_id integer PRIMARY KEY REFERENCES test_runs(id) ON DELETE CASCADE,
    data jsonb NOT NULL
  )`,
    `CREATE TABLE IF NOT EXISTS test_run_history (
    id serial PRIMARY KEY,
    run_id integer NOT NULL REFERENCES test_runs(id) ON DELETE CASCADE,
    file_name varchar(255) NOT NULL,
    data jsonb NOT NULL,
    UNIQUE (run_id, file_name)
  )`,
    `CREATE TABLE IF NOT EXISTS test_cases (
    id serial PRIMARY KEY,
    run_id integer NOT NULL REFERENCES test_runs(id) ON DELETE CASCADE,
    uuid uuid NOT NULL,
    name text NOT NULL,
    status varchar(20),
    status_details jsonb,
    stage varchar(20),
    history_id text,
    start bigint,
    stop bigint,
    test_case_id varchar(50),
    full_name text,
    title_path text[]
  )`,
    `ALTER TABLE test_cases DROP CONSTRAINT IF EXISTS test_cases_uuid_key`,
    `CREATE TABLE IF NOT EXISTS test_parameters (
    id serial PRIMARY KEY,
    test_id integer NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
    name varchar(30) NOT NULL,
    value text,
    exclude boolean NOT NULL DEFAULT false,
    mode varchar(30)
  )`,
    `CREATE TABLE IF NOT EXISTS test_labels (
    id serial PRIMARY KEY,
    test_id integer NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
    name varchar(30) NOT NULL,
    value text
  )`,
    `CREATE TABLE IF NOT EXISTS test_attachments (
    id serial PRIMARY KEY,
    test_id integer NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
    name varchar(50) NOT NULL,
    type varchar(100),
    data bytea
  )`,
    `CREATE TABLE IF NOT EXISTS test_links (
    id serial PRIMARY KEY,
    test_id integer NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
    name varchar(50),
    type varchar(100),
    url varchar(300)
  )`,
    `CREATE TABLE IF NOT EXISTS test_steps (
    id serial PRIMARY KEY,
    test_id integer NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
    step_order integer NOT NULL,
    description text NOT NULL,
    parent_step_id integer REFERENCES test_steps(id) ON DELETE CASCADE,
    uuid uuid NOT NULL,
    status varchar(20),
    status_details jsonb,
    stage varchar(20),
    start bigint,
    stop bigint
  )`,
    `ALTER TABLE test_steps DROP CONSTRAINT IF EXISTS test_steps_uuid_key`,
    `CREATE TABLE IF NOT EXISTS step_parameters (
    id serial PRIMARY KEY,
    step_id integer NOT NULL REFERENCES test_steps(id) ON DELETE CASCADE,
    name varchar(30) NOT NULL,
    value text,
    exclude boolean NOT NULL DEFAULT false,
    mode varchar(30)
  )`,
    `CREATE TABLE IF NOT EXISTS step_attachments (
    id serial PRIMARY KEY,
    step_id integer NOT NULL REFERENCES test_steps(id) ON DELETE CASCADE,
    name varchar(50) NOT NULL,
    type varchar(100),
    data bytea
  )`,
    "CREATE INDEX IF NOT EXISTS test_cases_run_id_idx ON test_cases(run_id)",
    "CREATE INDEX IF NOT EXISTS test_steps_test_id_idx ON test_steps(test_id)",
];
