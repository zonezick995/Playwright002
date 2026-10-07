# Playwright Automation Guidelines

## Project Structure

- Add automated scenarios under `tests/`, grouped by feature.
- Reuse the existing fixtures in `fixtures/` and page actions in `pages/`.
- Reuse API helpers and assertions in `Helper/` or `api/` when appropriate; do not create duplicate request or assertion utilities.
- Follow the repository's TypeScript and Playwright Test patterns.

## UI and API Automation

- For repeatable UI or API regression coverage, implement Playwright Test specs and run the narrowest relevant test command.
- Use the Playwright MCP browser for live, exploratory UI checks when the user asks to test a website directly. MCP browser actions are not equivalent to running a repository test spec.
- Use Playwright Test API facilities or the repository's API helper for automated API assertions. Do not claim that MCP browser interaction executed an API test spec.
- Assert observable outcomes, not just that an action completed. Keep tests isolated and avoid fixed sleeps when an explicit condition can be awaited.
- Do not perform purchases, payments, account creation, destructive changes, or other consequential actions on live systems without explicit user authorization.
- Keep credentials and tokens out of source files, reports, and chat output. Use configured environment variables and redact sensitive values.

## Validation

- Run the smallest relevant Playwright test command after changing automation code.
- For Playwright Test runs, use the configured Allure reporter as the primary detailed report; report the exact test command and Allure result/report location.
- For live exploratory MCP checks, provide a concise result summary in chat. Do not imply MCP activity is recorded in Allure unless it was explicitly captured by a Playwright Test run.
- Report pass/fail/blocked results and relevant limitations. Never present an exploratory MCP check as a passing automated test run.
- See [Playwright automation instructions](./instructions/playwright-tests.instructions.md) and the [Playwright MCP QA skill](./skills/playwright-mcp-qa/SKILL.md) for detailed procedures.
