---
name: playwright-testcase-design
description: "Design and present reviewable UI or API test cases only. Use when asked to create, draft, plan, or review test cases; do not implement specs, access websites, send API requests, or run tests."
argument-hint: "Feature, URL, API endpoint, requirements, or test scenario"
---

# Playwright Test Case Design

This skill is strictly for creating a reviewable test-case proposal in the conversation. It does not implement or execute tests.

## Scope

- Produce clear, atomic test cases for UI and/or API behavior from the user's requirements, supplied URLs, cURL/Postman requests, and repository context already available.
- Do not create or modify test specs, page objects, API helpers, fixtures, test data files, or other project files.
- Do not open or interact with a browser, use Playwright MCP, send HTTP/API requests, or run any test/build command.
- Do not treat invoking this skill or accepting its proposal as authorization to execute tests. A separate user request and approval workflow is required for implementation or execution.

## Workflow

1. Identify the requested feature, UI/API type, endpoint or page (if supplied), environment (if known), and expected behavior. If a material design choice is unclear, offer practical options, recommend one when appropriate, and ask one focused question before finalizing the proposal.
2. Use only information provided by the user or existing repository context. Do not access the live target to fill gaps.
3. Draft concise, atomic cases. Include relevant positive, negative, validation, boundary, and duplicate/idempotency cases only when supported by the requirements and safe to specify.
4. Mark unknown preconditions, response contracts, status codes, data cleanup, and environment assumptions as **TBD**; do not invent them as facts.
5. Present the proposal using this format:

| ID | Type | Scenario / objective | Preconditions and test data | Steps | Expected result | Environment / side effects |
|---|---|---|---|---|---|---|
| TC-01 | UI / API | One behavior to verify | Setup and data; redact secrets | Concise ordered actions | Observable UI state or response contract | Local / test / staging / production / TBD; note writes |

6. For API cases, include method, endpoint, request headers, payload shape, expected status, and key response fields when known. Redact secrets and personal data.
7. For UI cases, define the starting state, user interaction, and observable result; avoid prescribing implementation-specific selectors.
8. End by stating that only test-case design was performed and no website/API was accessed and no test was implemented or run. Stop there.

## Output quality

- Keep wording understandable to reviewers who are not automation developers.
- Give each case one objective and an observable pass condition.
- State dependencies between cases and side effects explicitly.
- Avoid duplicate cases and unsupported assumptions.
- If essential details are missing, mark them **TBD** in the proposal and ask the user to choose from reasonable options where possible; never fill gaps with an unapproved assumption.
