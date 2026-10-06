# Allure report từ PostgreSQL

Tài liệu này mô tả cách chuyển phần đọc dữ liệu Allure từ PostgreSQL và sinh
report bằng Allure CLI sang một project TypeScript/Node.js khác.

Luồng dữ liệu:

```text
PostgreSQL (test_runs + test_cases + các bảng con)
        │
        ▼
AllurePostgresRepository.readReport(runId)
        │
        ▼
AllurePostgresReportGenerator
        │
        ├── Ghi Allure result JSON và attachment tạm
        └── Chạy allure generate
                    │
                    ▼
          Allure HTML report
```

## 1. Source cần copy

Copy toàn bộ thư mục `Helper/Allure`, không chỉ riêng report generator:

```text
Helper/Allure/
├── index.ts
├── allure-results.parser.ts
├── types/
│   ├── allure.types.ts
│   └── parsed.types.ts
├── parsers/
│   ├── allure-attachment.parser.ts
│   ├── allure-label.parser.ts
│   ├── allure-link.parser.ts
│   ├── allure-metadata.parser.ts
│   ├── allure-parameter.parser.ts
│   ├── allure-result.parser.ts
│   ├── allure-run.parser.ts
│   └── allure-step.parser.ts
└── postgres/
    ├── allure-postgres.pool.ts
    ├── allure-postgres.schema.ts
    ├── allure-postgres.repository.ts
    ├── allure-postgres-report.generator.ts
    └── allure-postgres-reporter.ts
```

Các file liên quan cần đưa sang project đích:

- `tests/database/allure-db-report.spec.ts`: test đọc run từ database và sinh report.
- `package.json`: thêm script `report:allure-db`.
- `.gitignore`: ignore `.env.postgres.local` và `/allure-db-reports/`.

Nếu project đích cần **import Allure JSON vào database** trước khi tạo report,
copy thêm `tests/database/postgres-connection.spec.ts` và các parser source.
Schema được tạo tự động bởi `AllurePostgresRepository.insertRun()`.

## 2. Dependencies và runtime

Project cần Node.js, TypeScript, PostgreSQL driver và Allure CLI:

```powershell
npm install pg dotenv allure-commandline
npm install --save-dev @types/pg typescript
```

Đảm bảo có Java runtime đáp ứng yêu cầu của phiên bản Allure CLI đang dùng.
Kiểm tra CLI trước khi chạy:

```powershell
npx allure --version
```

Trong project Playwright, giữ nguyên Playwright test runner và thêm script:

```json
{
  "scripts": {
    "report:allure-db": "npx playwright test tests/database/allure-db-report.spec.ts"
  }
}
```

Nếu project không sử dụng Playwright, có thể gọi
`AllurePostgresReportGenerator.generate()` từ một script TypeScript/Node.js
riêng, đồng thời tự quản lý PostgreSQL pool lifecycle.

## 3. Cấu hình PostgreSQL

Tạo file `.env.postgres.local` ở root project. File này chứa credential nên
không commit:

```dotenv
PGHOST=127.0.0.1
PGPORT=5432
PGDATABASE=your_database
PGUSER=your_user
PGPASSWORD=your_password
```

Hoặc dùng một connection string:

```dotenv
DATABASE_URL=postgresql://your_user:your_password@127.0.0.1:5432/your_database
```

`createAllurePostgresPool()` tự đọc `.env.postgres.local`. `DATABASE_URL` được
ưu tiên nếu được khai báo; nếu không thì dùng `PGHOST`, `PGPORT`, `PGDATABASE`,
`PGUSER`, `PGPASSWORD`.

Thêm các entry sau vào `.gitignore`:

```gitignore
.env.postgres.local
/allure-db-reports/
```

Database role cần quyền connect database, đọc các bảng Allure và tạo thư mục
report ở filesystem. Nếu dùng cùng repository để import run mới thì role cũng
cần quyền tạo bảng/index và insert dữ liệu.

## 4. Schema dữ liệu

`ALLURE_POSTGRES_SCHEMA` trong `postgres/allure-postgres.schema.ts` tạo bảng
nếu chưa tồn tại:

| Bảng | Nội dung |
| --- | --- |
| `test_runs` | Tổng số test, trạng thái, thời gian, environment, channel |
| `test_run_environment` | Key/value trong `environment.properties` |
| `test_run_categories` | Category rules từ `categories.json` |
| `test_run_executor` | Metadata từ `executor.json` |
| `test_run_history` | Nội dung các JSON files trong thư mục `history/` |
| `test_cases` | Metadata và kết quả của mỗi test |
| `test_parameters` | Parameters cấp test |
| `test_labels` | Labels của test |
| `test_links` | Links của test |
| `test_attachments` | Attachment bytes cấp test |
| `test_steps` | Steps và quan hệ step cha/con |
| `step_parameters` | Parameters cấp step |
| `step_attachments` | Attachment bytes cấp step |

Allure attachment phải được lưu dưới dạng bytes trong cột `data` (`bytea`).
Report generator dừng với lỗi rõ ràng nếu attachment được tham chiếu trong
database nhưng `data` bị `NULL`.

## 5. Tự động insert sau khi test hoàn tất

`playwright.config.ts` cấu hình `AllurePostgresReporter` sau reporter
`allure-playwright`. Khi kết thúc test run, reporter:

1. So sánh các file result có trong `allure-results` trước và sau test run.
2. Chỉ parse các `*-result.json` mới tạo trong lần chạy hiện tại.
3. Tạo một `test_runs` row và insert tests cùng dữ liệu con vào PostgreSQL.
4. Ghi `runId` và số test đã insert ra console.

Do vậy các lệnh chạy test thông thường cũng tự import kết quả:

```powershell
npm run test:api
npx playwright test tests/heroTestCase/api-test.spec.ts
npm test
```

Auto-insert dùng cấu hình `DATABASE_URL` hoặc `PG*` trong
`.env.postgres.local`, giống test DB/report. Nếu DB insert lỗi, reporter báo lỗi
thay vì âm thầm bỏ qua.

Ngoài results/tests, reporter parse metadata tùy chọn trong `allure-results`:

```text
allure-results/
├── environment.properties
├── categories.json
├── executor.json
└── history/
    ├── history.json
    ├── history-trend.json
    └── <historyId>.json
```

Environment được parse theo cú pháp Java `.properties`; categories phải là JSON
array theo format Allure; executor phải là JSON object; các file trong `history/`
được lưu nguyên dạng JSON cùng tên file. Metadata không có sẽ để rỗng. JSON lỗi
hoặc file không đọc được sẽ làm import fail thay vì bỏ sót dữ liệu âm thầm.
Để lưu history/categories/executor, cần đặt các file đó vào `allure-results`
trước khi Playwright run kết thúc.

`tests/database/postgres-connection.spec.ts` vẫn có thể dùng để kiểm tra insert
thủ công; khi chạy chung với reporter, chính test đó cũng sẽ tạo một run tự động.

## 6. Sinh report từ dữ liệu đã có trong database

Từ root project:

```powershell
npm run report:allure-db
```

Mặc định test chọn run có `id` lớn nhất. Để chọn một run cụ thể:

```powershell
$env:ALLURE_RUN_ID='42'
npm run report:allure-db
```

Trên macOS/Linux:

```bash
ALLURE_RUN_ID=42 npm run report:allure-db
```

Test nằm trong `tests/database/allure-db-report.spec.ts`. Nó đọc dữ liệu bằng
`AllurePostgresRepository`, export các result JSON/attachment vào thư mục tạm
theo run, gọi `allure generate`, rồi xác nhận report `index.html` được tạo.

Output mặc định:

```text
allure-db-reports/
├── allure-results-<runId>/   # Allure input export từ database
└── allure-report-<runId>/    # HTML report do Allure CLI tạo
    └── index.html
```

Mỗi lần generate lại cùng một run, thư mục output của run đó sẽ được tạo mới.
Đây là output có thể tái tạo; không cần đưa vào Git.
Các environment, categories, executor và history đã lưu cũng được khôi phục
vào Allure results input trước khi chạy `allure generate`.

Mở report bằng browser:

```powershell
Start-Process .\allure-db-reports\allure-report-42\index.html
```

## 7. Sử dụng API trực tiếp

Ví dụ khi project đích có thể chạy TypeScript và đã cấu hình PostgreSQL:

```ts
import {
  AllurePostgresReportGenerator,
  AllurePostgresRepository,
  createAllurePostgresPool,
} from "./Helper/Allure";

const pool = createAllurePostgresPool();

try {
  const repository = new AllurePostgresRepository(pool);
  const generated = await new AllurePostgresReportGenerator(repository).generate(42);
  console.log(generated.filePath);
} finally {
  await pool.end();
}
```

Truyền `undefined` hoặc bỏ `runId` để dùng run mới nhất:

```ts
const generated = await generator.generate();
```

`readReport(runId?)` trả về `null` nếu không tìm thấy run; `generate(runId?)`
thông báo lỗi nếu run không tồn tại.

## 8. Kiểm tra sau khi copy

1. Điền cấu hình database vào `.env.postgres.local`.
2. Chạy `npx allure --version` để xác nhận Allure CLI và Java runtime.
3. Chạy `npm run build`.
4. Chạy một test Playwright; reporter sẽ tự insert run vào database khi suite kết thúc.
5. Chạy `npm run report:allure-db` hoặc chỉ định `ALLURE_RUN_ID`.
6. Mở `allure-db-reports/allure-report-<runId>/index.html`.

Report được sinh từ snapshot đang có trong database; nó không cần thư mục
`allure-results` gốc của test run.
