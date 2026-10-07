# Stage 1: install build dependencies and compile TypeScript into /app/dist.
FROM mcr.microsoft.com/playwright:v1.63.0-noble AS build

WORKDIR /app

# Copy manifests first so npm dependencies can be cached when only source changes.
COPY package.json package-lock.json ./
RUN npm ci

# Copy project sources and produce the compiled CLI and framework files.
COPY . .
RUN npm run build

# Stage 2: runtime image; keep the same Playwright version for browser compatibility.
FROM mcr.microsoft.com/playwright:v1.63.0-noble AS runtime

# Allure CLI runs on Java, so install only the runtime JRE in this stage.
RUN apt-get update \
    && apt-get install -y --no-install-recommends openjdk-17-jre-headless \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Default runtime settings; connection secrets should be provided at container run time.
ENV CI=true \
    NODE_ENV=sit \
    PLAYWRIGHT_HEADLESS=true

# Copy installed dependencies and compiled output from the build stage.
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

# Playwright loads TypeScript tests and config at runtime, so include their imports.
COPY --from=build /app/Helper ./Helper
COPY --from=build /app/api ./api
COPY --from=build /app/fixtures ./fixtures
COPY --from=build /app/pages ./pages
COPY --from=build /app/tests ./tests

# Include the Playwright/TypeScript runtime configuration and global teardown.
COPY --from=build /app/playwright.config.ts ./playwright.config.ts
COPY --from=build /app/global-teardown.ts ./global-teardown.ts
COPY --from=build /app/tsconfig.json ./tsconfig.json

# Treat CLI arguments after the image name as framework commands (test, report, help).
ENTRYPOINT ["node", "dist/cli.js"]
# Show CLI help when no command is supplied.
CMD ["help"]
