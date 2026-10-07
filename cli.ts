#!/usr/bin/env node
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  AllurePostgresReportGenerator,
  AllurePostgresRepository,
  createAllurePostgresPool,
} from "./Helper/Allure";

interface ReportOptions {
  runId?: number;
  outputDir?: string;
}

const HELP = `Playwright framework CLI

Usage:
  pw-framework test [spec-or-directory] [Playwright options]
  pw-framework report [--run-id <id>] [--output <directory>]
  pw-framework version
  pw-framework help

Commands:
  test      Run Playwright tests using the project configuration.
  report    Generate an Allure HTML report from PostgreSQL.
            Defaults to the latest run and ./allure-db-reports.
  version   Print the framework package version.
  help      Show this help.

Examples:
  pw-framework test tests/api --project=chromium
  pw-framework report
  pw-framework report --run-id 15 --output ./artifacts/reports`;

async function runPlaywright(args: string[]): Promise<number> {
  const cliPath = require.resolve("@playwright/test/cli");

  return new Promise((resolve) => {
    const child = spawn(process.execPath, [cliPath, "test", ...args], {
      cwd: process.cwd(),
      env: process.env,
      stdio: "inherit",
      windowsHide: true,
    });

    child.once("error", (error) => {
      console.error(`Unable to start Playwright: ${error.message}`);
      resolve(1);
    });
    child.once("close", (code) => resolve(code ?? 1));
  });
}

function parseReportOptions(args: string[]): ReportOptions {
  const options: ReportOptions = {};

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    const [option, inlineValue] = argument.split(/=(.*)/s, 2);
    if (option !== "--run-id" && option !== "--output") {
      throw new Error(`Unknown report option: ${argument}`);
    }

    const value = inlineValue ?? args[++index];
    if (!value || value.startsWith("--")) {
      throw new Error(`Expected a value after ${option}.`);
    }

    if (option === "--run-id") {
      if (options.runId !== undefined) {
        throw new Error("--run-id may only be provided once.");
      }
      const runId = Number(value);
      if (!Number.isSafeInteger(runId) || runId < 1) {
        throw new Error("--run-id must be a positive safe integer.");
      }
      options.runId = runId;
    } else {
      if (options.outputDir !== undefined) {
        throw new Error("--output may only be provided once.");
      }
      options.outputDir = path.resolve(process.cwd(), value);
    }
  }

  return options;
}

async function generateReport(args: string[]): Promise<void> {
  const options = parseReportOptions(args);
  const pool = createAllurePostgresPool();

  try {
    const repository = new AllurePostgresRepository(pool);
    const generator = new AllurePostgresReportGenerator(
      repository,
      options.outputDir,
    );
    const report = await generator.generate(options.runId);
    console.log("[Playwright Framework] Allure report generated:", {
      runId: report.runId,
      testCount: report.testCount,
      filePath: report.filePath,
    });
  } finally {
    await pool.end();
  }
}

async function printVersion(): Promise<void> {
  const packagePath = path.resolve(__dirname, "../package.json");
  const packageJson = JSON.parse(await readFile(packagePath, "utf8")) as {
    version?: unknown;
  };
  if (typeof packageJson.version !== "string") {
    throw new Error(`Package version is missing from ${packagePath}.`);
  }
  console.log(packageJson.version);
}

async function main(): Promise<number> {
  const [command, ...args] = process.argv.slice(2);

  switch (command) {
    case undefined:
    case "help":
    case "--help":
    case "-h":
      if (args.length > 0) {
        throw new Error("The help command does not accept additional arguments.");
      }
      console.log(HELP);
      return 0;
    case "test":
      return runPlaywright(args);
    case "report":
      await generateReport(args);
      return 0;
    case "version":
    case "--version":
    case "-v":
      if (args.length > 0) {
        throw new Error("The version command does not accept additional arguments.");
      }
      await printVersion();
      return 0;
    default:
      throw new Error(`Unknown command "${command}". Run "pw-framework help" for usage.`);
  }
}

void main()
  .then((exitCode) => {
    process.exitCode = exitCode;
  })
  .catch((error: unknown) => {
    console.error(
      `[Playwright Framework] ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 1;
  });
