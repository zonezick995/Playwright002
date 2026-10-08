#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_child_process_1 = require("node:child_process");
const promises_1 = require("node:fs/promises");
const node_path_1 = __importDefault(require("node:path"));
const Allure_1 = require("./Helper/Allure");
const HELP = `Playwright framework CLI

Usage:
  pw-framework test [spec-or-directory] [Playwright options]
  pw-framework test-and-report
  pw-framework report [--run-id <id>] [--output <directory>]
  pw-framework version
  pw-framework help

Commands:
  test      Run Playwright tests using the project configuration.
  test-and-report
            Run the full Playwright suite, then generate an Allure report from PostgreSQL.
  report    Generate an Allure HTML report from PostgreSQL.
            Defaults to the latest run and ./allure-db-reports.
  version   Print the framework package version.
  help      Show this help.

Examples:
  pw-framework test tests/api --project=chromium
  pw-framework test-and-report
  pw-framework report
  pw-framework report --run-id 15 --output ./artifacts/reports`;
async function runPlaywright(args) {
    const cliPath = require.resolve("@playwright/test/cli");
    return new Promise((resolve) => {
        const child = (0, node_child_process_1.spawn)(process.execPath, [cliPath, "test", ...args], {
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
function parseReportOptions(args) {
    const options = {};
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
        }
        else {
            if (options.outputDir !== undefined) {
                throw new Error("--output may only be provided once.");
            }
            options.outputDir = node_path_1.default.resolve(process.cwd(), value);
        }
    }
    return options;
}
async function generateReport(args) {
    const options = parseReportOptions(args);
    const pool = (0, Allure_1.createAllurePostgresPool)();
    try {
        const repository = new Allure_1.AllurePostgresRepository(pool);
        const generator = new Allure_1.AllurePostgresReportGenerator(repository, options.outputDir);
        const report = await generator.generate(options.runId);
        console.log("[Playwright Framework] Allure report generated:", {
            runId: report.runId,
            testCount: report.testCount,
            filePath: report.filePath,
        });
    }
    finally {
        await pool.end();
    }
}
async function runTestsAndGenerateReport() {
    const testExitCode = await runPlaywright([]);
    try {
        await generateReport([]);
    }
    catch (error) {
        console.error(`[Playwright Framework] Report generation failed: ${error instanceof Error ? error.message : String(error)}`);
        return testExitCode || 1;
    }
    return testExitCode;
}
async function printVersion() {
    const packagePath = node_path_1.default.resolve(__dirname, "../package.json");
    const packageJson = JSON.parse(await (0, promises_1.readFile)(packagePath, "utf8"));
    if (typeof packageJson.version !== "string") {
        throw new Error(`Package version is missing from ${packagePath}.`);
    }
    console.log(packageJson.version);
}
async function main() {
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
        case "test-and-report":
            if (args.length > 0) {
                throw new Error("The test-and-report command does not accept additional arguments.");
            }
            return runTestsAndGenerateReport();
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
    .catch((error) => {
    console.error(`[Playwright Framework] ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
});
