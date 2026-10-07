---
name: playwright-mcp-qa
description: "Plan and perform UI exploratory checks with the Playwright MCP browser and guide repeatable UI/API automation in this Playwright Test repository. Use for website testing, browser checks, API test design, and reporting QA results."
argument-hint: "Website URL or feature and the UI/API behavior to verify"
---

# Playwright MCP QA

Use this workflow when asked to test a website, explore a UI flow with MCP, or define repeatable UI/API automation for this repository.

If the user asks only to design/create test cases or invokes `/playwright-testcase-design`, use [the design-only skill](../playwright-testcase-design/SKILL.md) and stop without implementation or execution.

## Choose the right test mechanism

- **Live exploratory UI check:** use the connected Playwright MCP browser to navigate and interact with the requested website.
- **Repeatable UI regression test:** add or run a Playwright Test spec under `tests/`, using the existing fixtures and page actions.
- **API automation:** add or run a Playwright Test API spec using Playwright request facilities or existing helpers in `Helper/` and `api/`.
- The MCP browser is not the Playwright Test runner. Do not claim MCP actions ran a spec or produced automated test-run results.
- Use browser network inspection only to understand requests made by the UI. Do not claim this substitutes for API contract assertions.

## Procedure

1. Clarify the target URL or API endpoint, feature, environment, and whether the user wants an MCP exploration or repeatable Playwright Test coverage. For materially ambiguous choices, offer practical options, recommend one when useful, and ask one focused question at a time. Do not access or mutate the target to discover behavior before approval.
2. Draft and present a reviewable test-case table before implementation or execution:
   | ID | Type | Scenario / objective | Preconditions and test data | Steps | Expected result | Environment / side effects |
   |---|---|---|---|---|---|---|
   | TC-01 | UI / API | One behavior | Setup and data | Concise actions | Observable outcome | Target environment and side effects |
3. For API cases, include method, endpoint, payload shape (redact secrets), expected status, and key response fields. For UI cases, include observable state and relevant preconditions.
4. Ask the user to explicitly confirm the proposed cases, then stop and wait. Do not create/edit specs, navigate/interact with the target, or send requests until confirmation is given.
5. If the user does not confirm, declines, or asks only for a proposal, skip implementation and execution. If the scope/test data/environment changes materially, present the revised cases for confirmation again.
6. Approval covers only the listed cases. Approval does not authorize purchases, payments, destructive actions, or other consequential live-system changes; request separate explicit authorization for those.
7. After confirmation, run the approved bounded checks. For live UI checks, open the URL with the Playwright MCP browser and confirm final URL, title, and primary content before interacting.
8. For each UI check:
   - Locate controls by accessible role, label, or placeholder.
   - Perform one meaningful user action at a time.
   - Verify the resulting URL, visible state, message, or product/data change.
   - Capture console or network errors when relevant, and distinguish first-party failures from unrelated third-party errors.
9. For API automation:
   - Identify the endpoint, method, required inputs, expected status, and response contract from the repository or authorized test context.
   - Implement or run a Playwright Test spec using existing request helpers and assertions where suitable.
   - Validate status, response shape, and key fields. Keep test data isolated and clean up only test-created resources when safe.
   - Do not make unapproved writes or destructive requests against live systems.
10. If converting an exploratory finding into regression coverage, put the spec under the relevant `tests/` feature directory and follow `.github/instructions/playwright-tests.instructions.md`.
11. Report each approved case as **Pass**, **Fail**, or **Blocked**. Include the observed evidence, whether MCP or the Playwright Test runner was used, and any limits (for example, unavailable credentials or unstable third-party services).
12. For a Playwright Test run, use the configured Allure reporter as the detailed report: raw results are in `allure-results/`; run `npm run report:allure` to generate and open the report, or `npm run allure:generate` to generate it only. State the command used and report location.
13. For an exploratory MCP session, summarize the findings directly using the result table below. MCP browser activity is not automatically written to Allure; do not label the MCP summary as an Allure report or automated test report.

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
