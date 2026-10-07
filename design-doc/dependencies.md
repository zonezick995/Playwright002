# Dependency review

This document records which packages in `package.json` are needed to build,
test, lint, format, and run this project. It is an assessment only; no
dependencies were removed.

## Build and TypeScript compilation

The `build` script runs `tsc -p .`. The TypeScript configuration includes all
project `.ts` files except `node_modules` and `dist`, so test files and
Playwright configuration are compiled as well.

Packages required for the current TypeScript source and configuration:

| Package(s) | Why they are needed |
| --- | --- |
| `typescript` | Provides the `tsc` compiler used by `npm run build`. |
| `@types/node` | Provides Node.js types used by the source and required by `tsconfig.json`. |
| `@playwright/test` | Imported in the Playwright config, tests, fixtures, and helpers; also listed in `tsconfig.json`'s `types`. |
| `@types/mssql`, `@types/oracledb`, `@types/pg` | Provide TypeScript declarations for the database drivers imported by the project. |
| `dotenv`, `chalk`, `mssql`, `oracledb`, `pg`, `xlsx` | Imported by included TypeScript files, so the compiler must be able to resolve them. |

The last row contains runtime packages, which are also needed when the
corresponding functionality is executed. `fs` is part of Node.js and should be
imported from the built-in module; the npm package named `fs` in `dependencies`
is not needed.

## Test and report functionality

| Package(s) | Used for |
| --- | --- |
| `@playwright/test` | Running Playwright tests and resolving Playwright APIs. |
| `allure-playwright` | Allure reporter configured in `playwright.config.ts`. |
| `allure-commandline` | Generating Allure HTML reports, including reports generated from PostgreSQL data. |
| `dotenv` | Loading environment configuration at runtime. |
| `mssql`, `oracledb`, `pg` | Database integrations implemented by the database factory and Allure PostgreSQL reporter. |
| `xlsx` | Reading Excel test data. |
| `chalk` | Colored logging output. |

## Development tools

These packages are not required to compile the project or run its current
application/test functionality, but they support the related development
commands:

| Package(s) | Used for |
| --- | --- |
| `eslint`, `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser` | Running the `lint` script on TypeScript files. |
| `eslint-config-prettier` | Disabling ESLint rules that conflict with Prettier; referenced by the ESLint configuration. |
| `prettier` | Running the `format` script. |

`ts-node` is not referenced by the package scripts or source imports inspected
for this review. It appears removable if the project does not use it manually
or in tooling outside `package.json`.

## Build validation note

With the checked-in TypeScript version, `npm run build` currently fails because
`tsconfig.json` sets `ignoreDeprecations` to `"6.0"`, which TypeScript rejects
as an invalid value. A no-emit compile succeeds when that option is overridden
to `"5.0"`. This is a TypeScript configuration issue, not evidence of a
missing package.

## Recommendation

Do not remove packages solely because they are not needed by `tsc`: packages
used by tests, linting, formatting, or reporting are still needed for those
features. The clearest candidates for removal are the npm `fs` dependency and,
if unused by external/manual workflows, `ts-node`.
