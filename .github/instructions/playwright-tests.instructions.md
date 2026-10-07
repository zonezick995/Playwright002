---
description: "Use when creating, updating, or reviewing Playwright UI or API automation, test specs, page actions, API helpers, or assertions in this repository."
name: "Playwright UI and API Test Rules"
applyTo:
  - "tests/**/*.spec.ts"
  - "pages/**/*.ts"
  - "api/**/*.ts"
  - "Helper/API*.ts"
---

# Playwright UI and API Test Rules

## Mandatory approval gate

- Before implementing or executing a requested test, prepare a test-case proposal in the review table below and ask the user to confirm it.
- Do not add or edit test specs, send API requests, or operate the target UI before explicit confirmation of the proposed cases.
- If confirmation is absent, negative, or limited to discussing the plan, stop after design and skip implementation and execution.
- Treat confirmation as approval only for the listed cases and scope. Ask again if the test data, target environment, behavior, or side effects materially change.
- Approval of the plan does not authorize purchases, payments, destructive operations, or other consequential actions on a live system; obtain separate explicit authorization for those.

### Test-case review format

| ID | Type | Scenario / objective | Preconditions and test data | Steps | Expected result | Environment / side effects |
|---|---|---|---|---|---|---|
| TC-01 | UI / API | State one behavior to verify | Required setup and whether data is created or changed | Numbered, concise user/request actions | Observable UI state or response contract | Local / test / staging / production; note writes or cleanup |

- Keep cases atomic and reviewable. Include positive and relevant negative/boundary cases without expanding beyond the user's request.
- For API cases, show method, endpoint, payload shape with secrets redacted, expected status, and key response fields.
- Mark any unresolved contract, missing test data, or potentially consequential side effect explicitly; do not assume it is approved.
- Present the table and ask for explicit approval (for example, “Confirm these test cases so I can implement and run them?”). Then stop and wait.

## Test design

- Keep each test focused on one behavior and give it a descriptive outcome-based name.
- Use `test.describe` to group related scenarios and the existing fixtures from `fixtures/` where they provide the needed page objects or setup.
- Keep assertions in the spec or an existing shared assertion helper. Avoid duplicating fixture setup, page actions, API request wrappers, or assertion utilities.
- Make tests independent: do not rely on execution order or state left behind by another test.
- Prefer condition-based waits and Playwright's auto-waiting to arbitrary timeouts.

## UI tests

- Prefer accessible locators such as `getByRole`, `getByLabel`, and `getByPlaceholder`; use stable test IDs when the interface has no suitable accessible locator.
- Verify the user-visible result after navigation, submission, filtering, sorting, or other interaction.
- Keep reusable page behavior in the relevant `pages/` module and expose it through the repository's fixture pattern when appropriate.
- Use `expect` assertions with a specific expected state. Do not treat a successful click as proof that the feature worked.
- Avoid asserting incidental styling, generated IDs, or volatile content unless that detail is the behavior under test.

## API tests

- Use Playwright's API request capabilities or the existing helpers in `Helper/` and `api/`; preserve their established error handling and reporting behavior.
- Check the response status and relevant body shape, types, and values. Include negative cases when they are part of the requested behavior.
- Assert observable response behavior rather than implementation details. Do not log authorization headers, cookies, tokens, or sensitive response data.
- Keep API tests deterministic; use unique test data where needed and clean up only resources created by the test when cleanup is safe and supported.
- Do not send write, destructive, or high-impact requests to production or other live systems without explicit authorization.

## Running and reporting

- Run the narrowest relevant spec first, for example `npx playwright test tests/<feature>/<spec>.spec.ts`.
- Playwright Test is configured with `allure-playwright` writing raw results to `allure-results/`. Keep meaningful scenario/action boundaries in `test.step()` so they are readable in Allure; add Allure labels, descriptions, or attachments only when they improve diagnostic value.
- After a test run, generate and open the Allure report with `npm run report:allure`, or generate it without opening a browser with `npm run allure:generate`. The generated report is written to `allure-report/`.
- Treat Allure as the detailed report for automated Playwright Test runs. Do not promise an Allure result for an exploratory Playwright MCP session, which does not automatically write to the configured reporter.
- If a failure is environmental (network, credentials, unavailable service) rather than an assertion failure, report it as blocked or inconclusive and include the evidence.
- In the final summary, state whether the check was a repository Playwright Test run or an exploratory browser session using Playwright MCP, include the exact command/tool, and point to the Allure report when one was generated. Never conflate the two.
