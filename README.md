**Demo MCP Playwright**

- **Mục đích:** Framework Playwright + helpers để tự động hoá UI + DB (MSSQL/Postgres/Oracle) và API cho dự án lớn.

**Tóm tắt cấu trúc**
- `tests/` — test specs
- `fixtures/` — Playwright fixtures (DB, POM, ...)
- `pages/` — Page Object Model (POM)
- `utils/` — helpers: `db/` (DatabaseFactory, DB implementations), `apiHelper.ts`, `excelHelper.ts`, `jsonHelper.ts`, `logger.ts`
- `playwright.config.ts`, `.env.*` — cấu hình test / môi trường

---

## Yêu cầu
- Node.js >= 18 (để có `fetch` sẵn), npm
- Browsers: `npx playwright install`

## Cài đặt

### 1) Yêu cầu trước khi bắt đầu (mới hoàn toàn)
- Cài Node.js (phiên bản >= 18). Trên Windows dùng installer từ nodejs.org hoặc `nvm-windows`.
- Git (để clone repo).
- Trên Windows, với `oracledb` cần Oracle Instant Client (nếu bạn sẽ dùng Oracle); đặt PATH phù hợp.

### 2) Clone repo
```bash
git clone <repo-url>
cd demo-mcp-playwright
```

### 3) Cài dependencies
```bash
npm ci
```

### 4) Cài Playwright browsers
```bash
npm run install-browsers
# hoặc: npx playwright install
```

### 5) (Nếu dùng Oracle) Cài Oracle Instant Client trên Windows
- Tải Oracle Instant Client ZIP từ Oracle, giải nén vào thư mục (ví dụ `C:\instantclient_19_11`).
- Thêm thư mục vào `PATH` (System Environment) rồi khởi động lại terminal/IDE.
- Nếu gặp lỗi khi cài `oracledb`, xem tài liệu `oracledb` để thiết lập `OCI_LIB_DIR` / `OCI_INC_DIR` trước khi `npm ci`.

### 6) (Nếu cần) Các driver/tiện ích khác
- `mssql` (npm package) thường không cần bước native trên Windows.
- `pg` (Postgres) hầu hết không cần cài thêm; nếu cần client native thì cài `libpq` theo OS.

### 7) Tạo file môi trường
- Sao chép file mẫu (ví dụ `.env.sit`) thành `.env` và chỉnh giá trị DB/URL/credentials.
```powershell
copy .env.sit .env
# (hoặc) cp .env.sit .env
```

Ví dụ biến cần cấu hình: `DB_CLMS_HOST`, `DB_CLMS_USER`, `DB_CLMS_PASSWORD`, `DB_CLMS_NAME` hoặc `DB_CONFIGS` (JSON cho nhiều DB).

### 8) Build & chạy test lần đầu
```bash
npm run build    # (tuỳ chọn) biên dịch TypeScript
npm run test     # chạy toàn bộ test (headless theo cấu hình)
```

### 9) Lưu ý & xử lý lỗi thường gặp
- Nếu Playwright báo thiếu browser: chạy `npx playwright install` hoặc `npm run install-browsers`.
- Lỗi `oracledb` thường do thiếu Instant Client hoặc PATH chưa đúng — kiểm tra biến môi trường và quyền truy cập.
- Trên Windows, chạy PowerShell/CMD với quyền phù hợp khi thay PATH hoặc cài client.


## Biến môi trường
- Copy `.env.sit` → `.env` và cập nhật giá trị.
**Demo MCP Playwright**

Framework mẫu dùng `@playwright/test` để tự động hoá UI, hỗ trợ tương tác với DB (MSSQL/Postgres/Oracle) và API.

**Tóm tắt nhanh**
- **Node:** dự án dùng TypeScript + Playwright.
- **Mục tiêu:** chạy E2E tests với cấu trúc POM, fixtures cho DB & POM, helpers cho API/Excel/JSON.

**Yêu cầu**
- Node.js >= 18, npm
- Browsers cho Playwright: `npm run install-browsers`

**Cài đặt**
```bash
npm ci
npm run install-browsers
```

**Scripts hữu ích** (xem `package.json`):
- `npm run test` — chạy test (Playwright headless theo config)
- `npm run test:headed` — chạy test có giao diện
- `npm run test:chrome|firefox|webkit` — chạy theo project browser
- `npm run test:debug` — chạy ở chế độ debug
- `npm run build` — biên dịch TypeScript

**Biến môi trường**
- Copy file môi trường mẫu (ví dụ `.env.sit`) → `.env` và cập nhật.
- Thông tin DB có thể đặt lần lượt như `DB_CLMS_HOST`, `DB_CLMS_USER`, `DB_CLMS_PASSWORD`, `DB_CLMS_NAME`.
- Hỗ trợ cấu hình nhiều DB qua biến JSON (ví dụ `DB_CONFIGS`) nếu cần.

**Chạy test**
- Toàn bộ suite:
```bash
npm run test
```
- Chạy một spec cụ thể:
```bash
npx playwright test tests/specs/test-login.spec.ts
```
- Mở report HTML:
```bash
npx playwright show-report <report-folder>
```

**Cấu trúc dự án (tóm tắt)**
- `tests/` — test specs và scenarios
- `fixtures/` — Playwright fixtures (ví dụ: `auth.fixture.ts`, `db.fixture.ts`, `pom.fixture.ts`)
- `pages/` — Page Object Model (POM) theo module
- `utils/` — helpers: `apiHelper.ts`, `excelHelper.ts`, `jsonHelper.ts`, `logger.ts`, `db/` (DatabaseFactory, driver implementations)
- `test-data/` — dữ liệu test mẫu

**Fixtures & POM (nhanh)**
- `pom.fixture.ts` kết hợp POM + DB fixtures, inject POM instance vào test: `test('x', async ({ pm }) => { ... })`.
- POM đặt ở `pages/` theo thư mục chức năng (ví dụ `clmsPage`, `eisgnPage`).

**DB & QueryStore**
- `utils/db/DatabaseFactory.ts` tạo đối tượng DB theo driver (mssql/oracle/pg).
- `utils/db/core/QueryStore.ts` lưu SQL theo key; gọi qua `db.query('sqlKey', params)`.

**Helpers chính**
- `utils/apiHelper.ts`: wrapper HTTP (timeout, retries, template bodyParams).
- `utils/excelHelper.ts`: đọc/ghi Excel, hỗ trợ đọc nhiều sheet.
- `utils/jsonHelper.ts`: load/save JSON test-data.
- `utils/logger.ts`: logger chung cho test và helpers.

**Best practices**
- Không commit `.env` chứa thông tin nhạy cảm.
- Dùng `throwOnError` với helper đọc file để fail sớm nếu dữ liệu thiếu.
- Viết test nhỏ, độc lập, dùng fixtures để tái sử dụng setup/teardown.

**CI / Báo cáo**
- CI cơ bản: `npm ci` → `npm run install-browsers` → `npm run test` → thu thập `playwright-report`, screenshots, traces.
- Có thể thêm reporter JUnit/Allure trong `playwright.config.ts` để tích hợp CI.
