# Playwright Automation Guidelines

## Decision-making

- When a request requires choosing between materially different approaches, scope, behavior, test data, environments, or side effects, do not silently choose on the user's behalf. Briefly explain the decision, offer practical options, recommend one when appropriate, and ask the user which they prefer before proceeding.
- If a necessary detail is unclear, ask one focused question at a time and include reasonable suggestions. Do not ask about routine implementation details already determined by the request or established project patterns.
- Proceed without asking only when the user has already specified the choice, explicitly delegated the decision, or the choice is a low-impact implementation detail with a clear repository convention.

## Project Structure

- Add automated scenarios under `tests/`, grouped by feature.
- Reuse the existing fixtures in `fixtures/` and page actions in `pages/`.
- Reuse API helpers and assertions in `Helper/` or `api/` when appropriate; do not create duplicate request or assertion utilities.
- Follow the repository's TypeScript and Playwright Test patterns.

## UI and API Automation

- Before implementing or running any requested test, first design a concise, reviewable test-case table and ask the user to confirm it. Do not create or modify test specs, send test requests, or interact with the target system until the user explicitly approves the proposed cases.
- If the user does not confirm, or asks only for test design, stop after presenting the cases; skip implementation and execution.
- When the user invokes `/playwright-testcase-design` or asks only to design/create test cases, use [the test-case design skill](./skills/playwright-testcase-design/SKILL.md). That skill is design-only: do not implement automation or access the target system.
- For repeatable UI or API regression coverage, implement Playwright Test specs and run the narrowest relevant test command.
- Use the Playwright MCP browser for live, exploratory UI checks when the user asks to test a website directly. MCP browser actions are not equivalent to running a repository test spec.
- Use Playwright Test API facilities or the repository's API helper for automated API assertions. Do not claim that MCP browser interaction executed an API test spec.
- Assert observable outcomes, not just that an action completed. Keep tests isolated and avoid fixed sleeps when an explicit condition can be awaited.
- Do not perform purchases, payments, account creation, destructive changes, or other consequential actions on live systems without explicit user authorization.
- Approval of a test-case plan does not by itself authorize consequential live-system actions; obtain separate explicit authorization when needed.
- Keep credentials and tokens out of source files, reports, and chat output. Use configured environment variables and redact sensitive values.

## Validation

- Run the smallest relevant Playwright test command after changing automation code.
- For Playwright Test runs, use the configured Allure reporter as the primary detailed report; report the exact test command and Allure result/report location.
- For live exploratory MCP checks, provide a concise result summary in chat. Do not imply MCP activity is recorded in Allure unless it was explicitly captured by a Playwright Test run.
- Report pass/fail/blocked results and relevant limitations. Never present an exploratory MCP check as a passing automated test run.
- See [Playwright automation instructions](./instructions/playwright-tests.instructions.md) and the [Playwright MCP QA skill](./skills/playwright-mcp-qa/SKILL.md) for detailed procedures.
- For test-case design only, see [Playwright Test Case Design](./skills/playwright-testcase-design/SKILL.md).
