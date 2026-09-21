FROM mcr.microsoft.com/playwright:v1.63.0-noble

ARG TARGETARCH
ARG BASE_URL=http://localhost:3000

RUN apt-get update \
    && apt-get install -y --no-install-recommends openjdk-17-jre-headless \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV CI=true \
    NODE_ENV=sit \
    PLAYWRIGHT_HEADLESS=true \
    JAVA_HOME=/usr/lib/jvm/java-17-openjdk-${TARGETARCH}

COPY package.json package-lock.json ./
RUN npm ci
RUN npx playwright install chromium

COPY . .

EXPOSE 8080

# Keep the test exit code while generating reports for CI artifacts.
CMD ["sh", "-c", "npm run test:api; test_exit=$?; npm run allure:generate || true; if [ \"${SERVE_REPORT:-true}\" = \"true\" ]; then exec python3 -m http.server 8080 --bind 0.0.0.0 --directory allure-report; else exit $test_exit; fi"]
