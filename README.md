# Demo MCP Playwright

Framework tự động hóa kiểm thử bằng TypeScript và Playwright Test, hỗ trợ kiểm
thử UI, API, database và báo cáo Allure. Repository cũng cung cấp CLI để chạy
Playwright và tạo report từ PostgreSQL.

## Mục lục

- [Yêu cầu](#yêu-cầu)
- [Cài đặt](#cài-đặt)
- [Cấu trúc framework](#cấu-trúc-framework)
- [Luồng làm việc QA/QC](#luồng-làm-việc-qaqc)
- [Viết và chạy kiểm thử](#viết-và-chạy-kiểm-thử)
- [Cấu hình môi trường](#cấu-hình-môi-trường)
- [Báo cáo](#báo-cáo)
- [Framework CLI và Docker](#framework-cli-và-docker)
- [Tài liệu liên quan](#tài-liệu-liên-quan)

## Yêu cầu

- Node.js phiên bản 18 trở lên và npm.
- Trình duyệt Playwright: cài bằng `npm run install-browsers`.
- Oracle Instant Client nếu chạy kiểm thử Oracle; cấu hình theo hướng dẫn của
  `oracledb` trên hệ điều hành đang sử dụng.

## Cài đặt

```bash
git clone <repo-url>
cd Playwright002
npm ci
npm run install-browsers
```

Playwright config mặc định đọc `.env.sit` vì `NODE_ENV` mặc định là `sit`.
Tạo hoặc cập nhật file môi trường tương ứng với môi trường cần chạy; không
commit file chứa credential hoặc dữ liệu nhạy cảm.

```bash
# Ví dụ nếu cần tạo file môi trường local từ file mẫu
cp .env.sit .env.local
```

Chọn file bằng `NODE_ENV`, ví dụ `NODE_ENV=local`. Trên PowerShell:

```powershell
$env:NODE_ENV = "local"
npm run test
```

## Cấu trúc framework

```text
.
├── src/
│   ├── api/
│   │   ├── business/   # Use-case và xử lý nghiệp vụ API
│   │   ├── client/     # HTTP transport dựa trên Playwright APIRequestContext
│   │   ├── models/     # Kiểu request, response và assertion
│   │   ├── services/   # Facade API và assertion service
│   │   ├── index.ts    # Public exports
│   │   ├── baseApi.ts  # Re-export tương thích
│   │   └── baseAssert.ts
│   ├── fixtures/
│   │   ├── api.fixtures.ts # Fixture API độc lập, không khởi tạo browser page
│   │   ├── db.fixtures.ts  # Fixture database
│   │   └── pom.fixtures.ts # Fixture UI/POM và các action theo ứng dụng
│   ├── pages/          # Page action và logic UI theo ứng dụng
│   ├── Helper/         # Logger, Allure, database, Excel/JSON và tiện ích chung
│   ├── cli.ts          # CLI của framework
│   └── global-teardown.ts
├── tests/              # Playwright specs, nhóm theo tính năng
├── design-docs/        # Tài liệu thiết kế, hướng dẫn và phân tích requirement
│   ├── qa-requirements/
│   ├── allure-parser.md
│   ├── allure-postgres-report.md
│   ├── api-client-services-model.md
│   ├── dependencies.md
│   ├── framework-cli-design.md
│   └── framework-cli.md
├── playwright.config.ts
└── package.json
```

### Phân lớp API

- `src/api/business/`: đóng gói một nghiệp vụ/use-case có thể tái sử dụng, gồm
  endpoint, payload và headers phù hợp. Ví dụ: `createPlace`, `loginToClms`.
- `src/api/client/`: gửi request, xử lý timeout/retry, body, response và Allure
  attachment.
- `src/api/services/`: cung cấp facade gọi API và assertion response.
- `src/api/models/`: định nghĩa kiểu dữ liệu request, response và quy tắc assertion.
- `src/api/index.ts`: điểm import công khai cho service, business action, assertion
  và model.
- `src/fixtures/api.fixtures.ts`: cung cấp fixture `api` cho API spec.

API spec nên tập trung vào việc gọi business action và kiểm tra kết quả; không
đưa payload nghiệp vụ hoặc chi tiết HTTP lặp lại vào spec. Các page trong
`src/pages/` chỉ xử lý luồng UI, không dùng làm nơi chứa API test.

### Fixture UI và database

- Dùng `src/fixtures/pom.fixtures.ts` cho kiểm thử UI cần page và action theo ứng
  dụng như `clms`, `hero`, `orangeHr`.
- Dùng `src/fixtures/db.fixtures.ts` khi cần kết nối database trong test.
- Dùng `src/fixtures/api.fixtures.ts` cho API spec độc lập để không phụ thuộc vào
  browser fixture.

## Luồng làm việc QA/QC

Repository cung cấp các skill trong `.github/skills/` để chuyển requirement
qua các bước:

1. **Phân tích requirement:** dùng `qa-requirement-analysis` để chuẩn hóa mục
   tiêu, quy tắc nghiệp vụ, acceptance criteria, câu hỏi, giả định và rủi ro.
   Tài liệu Markdown mặc định được lưu tại
   `design-docs/qa-requirements/<feature-slug>-requirement-analysis.md`.
2. **Thiết kế test case:** dùng `playwright-testcase-design` để tạo test case
   UI/API, giữ liên kết tới mã requirement và trình bày để người dùng duyệt.
   Skill này chỉ thiết kế, không truy cập hệ thống, viết spec hoặc chạy test.
3. **Triển khai test case:** sau khi test case được duyệt, dùng
   `playwright-testcase-implementation` để tạo/cập nhật Playwright spec, fixture
   hoặc business action phù hợp.
4. **Kiểm tra QA:** dùng `playwright-mcp-qa` cho kiểm tra khám phá UI bằng MCP,
   tự động hóa hồi quy và báo cáo kết quả.

Trước khi viết hoặc chạy test, cần được xác nhận test case, môi trường và phạm
vi. Việc duyệt test case không tự động cho phép thao tác có hậu quả như mua
hàng, thanh toán, xóa dữ liệu hoặc thay đổi đáng kể trên hệ thống thật. Không
đưa credential, token, cookie hoặc dữ liệu cá nhân vào mã nguồn, log hay report.

## Viết và chạy kiểm thử

### Các lệnh thông dụng

```bash
npm run test                         # Toàn bộ suite
npx playwright test tests/<feature>/<spec>.spec.ts
npm run test:headed                  # Chạy có giao diện
npm run test:chrome                  # Chạy project Chromium
npm run test:firefox                 # Chạy project Firefox
npm run test:webkit                  # Chạy project WebKit
npm run test:debug                   # Chạy chế độ debug
npm run test:api                     # Chạy API spec Add Place
npm run build                        # Biên dịch TypeScript
npm run lint                         # ESLint
```

Các project browser được bật phụ thuộc `playwright.config.ts`; hiện Chromium là
project đang bật mặc định. Các script riêng cho Firefox/WebKit chỉ hữu ích khi
project tương ứng đã được bật trong config.

### Ví dụ API spec

API spec nhận `api` từ fixture, gọi business action trong `src/api/` và assertion
response đã xác định:

```ts
import { test } from '../../src/fixtures/api.fixtures';
import { assertApiResponse, createPlace } from '../../src/api';

test('creates a place successfully', async ({ api }) => {
  const response = await createPlace(api);

  await assertApiResponse(response, {
    statusCode: 200,
    fieldValues: { status: 'OK' },
  });
});
```

Giữ test độc lập, đặt tên mô tả hành vi, ưu tiên assertion trên kết quả quan
sát được và tránh timeout cố định khi có thể chờ theo điều kiện.

## Cấu hình môi trường

- `NODE_ENV`: chọn file `.env.<NODE_ENV>`; mặc định là `sit`.
- `BASE_URL`: base URL cho điều hướng UI; mặc định `http://localhost:3000`.
- `PLAYWRIGHT_HEADLESS`: đặt `false` để chạy browser có giao diện.
- `LOG_LEVEL`: đặt `DEBUG` để bật mức log debug.
- `CLMS_USER`, `CLMS_PWD`: thông tin đăng nhập CLMS, nếu cần cho test tương
  ứng.
- `BASE_API_URL`: base URL API CLMS.
- `BASE_API_URL_DEMO_ADD_PLACE`: endpoint Add Place.
- `DATABASE_URL` hoặc các biến `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`,
  `PGPASSWORD`: kết nối PostgreSQL dùng cho reporter/report từ PostgreSQL.
- Các biến kết nối database khác cần được cấu hình theo database provider và
  cấu hình của test đang chạy.

Khai báo các biến nhạy cảm qua file môi trường không commit hoặc secret manager
của CI. Không sao chép giá trị credential vào README.

## Báo cáo

Playwright được cấu hình tạo:

- HTML report theo từng lần chạy trong `test-report/<timestamp>/`.
- Allure raw results trong `allure-results/`.
- PostgreSQL report data thông qua reporter đã cấu hình.
- Trace khi test thất bại và được retry; screenshot khi test thất bại.

Tạo và mở Allure HTML report:

```bash
npm run report:allure
```

Chỉ tạo report, không mở trình duyệt:

```bash
npm run allure:generate
```

Report được tạo trong `allure-report/`. Các hoạt động khám phá bằng Playwright
MCP không tự động được ghi vào Allure.

Để chạy spec tạo report database riêng:

```bash
npm run report:allure-db
```

## Framework CLI và Docker

CLI hỗ trợ chạy Playwright và tạo Allure HTML report từ PostgreSQL. Build trước
khi sử dụng CLI:

```bash
npm run build
npm run framework -- help
npm run framework -- test tests/heroTestCase/api-test.spec.ts
npm run framework -- test-and-report
npm run framework -- report
npm run framework -- report --run-id 15 --output ./artifacts/reports
```

Hướng dẫn đầy đủ về CLI, PostgreSQL và Docker: [design-docs/framework-cli.md](./design-docs/framework-cli.md).
Tài liệu thiết kế CLI: [design-docs/framework-cli-design.md](./design-docs/framework-cli-design.md).
Thiết kế phân lớp API: [design-docs/api-client-services-model.md](./design-docs/api-client-services-model.md).

## Tài liệu liên quan

- [Playwright instruction](./.github/instructions/playwright-tests.instructions.md)
- [Skill phân tích requirement QA/QC](./.github/skills/qa-requirement-analysis/SKILL.md)
- [Skill thiết kế test case](./.github/skills/playwright-testcase-design/SKILL.md)
- [Skill triển khai test case](./.github/skills/playwright-testcase-implementation/SKILL.md)
- [Skill Playwright MCP QA](./.github/skills/playwright-mcp-qa/SKILL.md)
