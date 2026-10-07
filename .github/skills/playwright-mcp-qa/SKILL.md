---
name: playwright-mcp-qa
description: "Plan and perform UI exploratory checks with the Playwright MCP browser and guide repeatable UI/API automation in this Playwright Test repository. Use for website testing, browser checks, API test design, and reporting QA results."
argument-hint: "Website URL or feature and the UI/API behavior to verify"
---

# Playwright MCP QA

Use this workflow when asked to test a website, explore a UI flow with MCP, or define repeatable UI/API automation for this repository.

## Choose the right test mechanism

- **Live exploratory UI check:** use the connected Playwright MCP browser to navigate and interact with the requested website.
- **Repeatable UI regression test:** add or run a Playwright Test spec under `tests/`, using the existing fixtures and page actions.
- **API automation:** add or run a Playwright Test API spec using Playwright request facilities or existing helpers in `Helper/` and `api/`.
- The MCP browser is not the Playwright Test runner. Do not claim MCP actions ran a spec or produced automated test-run results.
- Use browser network inspection only to understand requests made by the UI. Do not claim this substitutes for API contract assertions.

## Procedure

1. Confirm the requested URL, feature, and whether the user expects exploratory checks or repeatable automated coverage. If not specified, do a bounded exploratory check and propose relevant regression cases.
2. Open the target URL with the Playwright MCP browser. Confirm the final URL, page title, and that the primary content is loaded before interacting.
3. Derive test cases from visible functionality and the request. Cover relevant happy paths, boundary/empty states, and validation/error behavior. Keep checks within the authorized scope.
4. For each UI check:
   - Locate controls by accessible role, label, or placeholder.
   - Perform one meaningful user action at a time.
   - Verify the resulting URL, visible state, message, or product/data change.
   - Capture console or network errors when relevant, and distinguish first-party failures from unrelated third-party errors.
5. For API automation:
   - Identify the endpoint, method, required inputs, expected status, and response contract from the repository or authorized test context.
   - Implement or run a Playwright Test spec using existing request helpers and assertions where suitable.
   - Validate status, response shape, and key fields. Keep test data isolated and clean up only test-created resources when safe.
   - Do not make unapproved writes or destructive requests against live systems.
6. If converting an exploratory finding into regression coverage, put the spec under the relevant `tests/` feature directory and follow `.github/instructions/playwright-tests.instructions.md`.
7. Report each case as **Pass**, **Fail**, or **Blocked**. Include the observed evidence, whether MCP or the Playwright Test runner was used, and any limits (for example, unavailable credentials or unstable third-party services).
8. For a Playwright Test run, use the configured Allure reporter as the detailed report: raw results are in `allure-results/`; run `npm run report:allure` to generate and open the report, or `npm run allure:generate` to generate it only. State the command used and report location.
9. For an exploratory MCP session, summarize the findings directly using the result table below. MCP browser activity is not automatically written to Allure; do not label the MCP summary as an Allure report or automated test report.

## Safety and data handling

- Do not purchase, pay, create accounts, submit consequential forms, or make destructive changes on a live site without explicit user authorization.
- Do not expose credentials, tokens, cookies, personal data, or sensitive API payloads in screenshots, logs, or the final report.
- Stop before a consequential confirmation step if authorization is unclear.

## Exploratory MCP result format

| # | Test case | Result | Evidence / notes |
|---|---|---|---|
| 1 | Describe the behavior checked | Pass / Fail / Blocked | State the actual visible or response evidence |

Summarize significant product issues separately from environmental or third-party errors. Do not infer a pass from a page loading or a control being clickable.

## Automated run summary

For Playwright Test runs, summarize the test command and outcome, then link or identify the generated Allure report and its location. Highlight failed or blocked cases and their evidence; use Allure for detailed steps, attachments, and diagnostics rather than duplicating the full report in chat.
