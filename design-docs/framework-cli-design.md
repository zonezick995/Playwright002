# Thiết kế Framework CLI

## Mục tiêu

Tạo giao diện command-line thống nhất để:

- Chạy Playwright tests theo project config và giữ nguyên exit code cho CI.
- Đọc một run từ PostgreSQL và sinh Allure HTML.
- Dùng cùng một CLI từ npm/local và Docker image.
- Cho phép CI hoặc người dùng chọn run và mount thư mục chứa report.

## Phạm vi hiện tại

CLI được triển khai ở root source `cli.ts` và compile thành `dist/cli.js`.
`package.json` khai báo npm bin `pw-framework` cùng script `framework` để chạy
CLI trong source project.

Các command hiện hỗ trợ:

| Command | Xử lý |
| --- | --- |
| `help` | In usage, danh sách command và ví dụ. |
| `version` | Đọc version từ `package.json`. |
| `test [args...]` | Khởi chạy Playwright CLI bằng child process và chuyển tiếp args. |
| `test-and-report` | Chạy toàn bộ suite; sau đó sinh Allure report từ PostgreSQL. |
| `report [options]` | Gọi repository và report generator để dựng report từ database. |

## Kiến trúc

```text
User / CI
   │
   ├── npm run framework -- test <Playwright args>
   │        └── cli.ts
   │             └── child process: @playwright/test/cli test <args>
   │                    └── playwright.config.ts + reporters
   │                           ├── allure-results
   │                           └── PostgreSQL (auto-import khi test kết thúc)
   │
   ├── npm run framework -- test-and-report
   │        └── chạy full Playwright suite → đọc PostgreSQL → sinh Allure HTML
   │
   └── npm run framework -- report [--run-id] [--output]
            └── cli.ts
                 ├── createAllurePostgresPool()
                 ├── AllurePostgresRepository.readReport(runId)
                 └── AllurePostgresReportGenerator.generate(runId)
                       ├── dựng Allure result files/metadata/attachments
                       ├── gọi Allure CLI
                       └── <output>/allure-report-<id>/index.html
```

## Quyết định triển khai

### Test command

`test` không táiimplement Playwright options. Nó khởi chạy
`@playwright/test/cli` bằng `process.execPath`, truyền nguyên các arguments,
inherit stdin/stdout/stderr và dùng working directory hiện tại. Exit code của
Playwright được trả lại làm exit code của CLI; lỗi khởi tạo process được in
thành thông báo lỗi và trả mã khác 0.

Việc chạy Playwright config mặc định giữ lại reporters trong config. Caller có
thể truyền options tiêu chuẩn; nếu dùng `--reporter`, tùy chọn này có thể thay
thế reporter list trong config và thay đổi side effects như Allure/PostgreSQL.

### Report command

`report` nhận:

- `--run-id <positive-safe-integer>` (tùy chọn): nếu bỏ qua, generator chọn
  run mới nhất theo repository.
- `--output <directory>` (tùy chọn): thư mục root output. Mặc định là
  `allure-db-reports` dưới current working directory.

Parser từ chối option không hỗ trợ, giá trị thiếu, giá trị run id không hợp lệ,
và option trùng lặp. CLI luôn đóng PostgreSQL pool trong `finally`. Lỗi database,
run không tồn tại hoặc lỗi Allure CLI được báo lỗi và làm command thất bại.

Generator là nơi giữ chi tiết dựng lại Allure result JSON, attachments,
environment, categories, executor và history. CLI chỉ điều phối các component
đó, không nhân đôi logic report.

### Test rồi sinh report trong một command

`test-and-report` chạy Playwright không kèm filter để thu thập toàn bộ suite.
Sau khi Playwright kết thúc, CLI gọi luồng `report` trên run mới nhất trong
PostgreSQL. Việc sinh report vẫn được thử khi test trả về lỗi, để giữ lại HTML
diagnostics. Exit code cuối cùng ưu tiên lỗi test; nếu test pass nhưng sinh
report thất bại, command trả mã khác 0.

### Docker multi-stage và entrypoint

Dockerfile tách image thành hai stage:

1. `build` cài dependencies bằng `npm ci`, copy source và compile TypeScript
   bằng `npm run build`.
2. `runtime` dùng cùng Playwright base image, cài Java cần cho Allure CLI, rồi
   chỉ copy `package.json`, `node_modules`, `dist` và source/config cần để chạy
   Playwright (`Helper`, `api`, `fixtures`, `pages`, `tests`,
   `playwright.config.ts`, `global-teardown.ts`, `tsconfig.json`).

Source test/config được giữ trong runtime vì Playwright nạp các spec/config
TypeScript trực tiếp khi thực thi `test`; chỉ có `dist` là chưa đủ. Dependency
tree từ build stage được copy vì runtime CLI vẫn cần Playwright, Allure CLI,
reporter và PostgreSQL driver.

Runtime stage dùng:

```dockerfile
ENTRYPOINT ["sh", "/app/docker-entrypoint.sh"]
CMD ["test-and-report"]
```

Entrypoint script dispatch `test`, `report`, `help` và command framework khác
sang `node /app/dist/cli.js`. Nếu command đầu tiên là `shell`, script chuyển
tiếp sang `/bin/bash` và giữ nguyên các arguments còn lại. Mặc định container
chạy toàn bộ suite rồi sinh report từ PostgreSQL. Người dùng có thể ghi đè
command mặc định bằng framework command khác hoặc vào shell tương tác.

Ví dụ mở shell:

```powershell
docker run --rm -it <image> shell
```

`-it` cấp stdin/TTY cần thiết cho shell tương tác; không cần rebuild image để
chọn command khác, chỉ cần truyền command khi tạo container.

### Secrets và output

`.dockerignore` loại trừ `.env*`, giữ ngoại lệ `.env.example` để tránh gửi
credentials vào build context. Runtime nhận DB settings qua environment; report
được lưu trong output directory được chọn. Người gọi Docker cần bind-mount
directory đó để file còn tồn tại sau khi container kết thúc.

Không đưa database credentials vào image, Dockerfile `ARG`, hoặc image layer.
Trong container, `localhost` trỏ về container hiện tại; host database cần được
địa chỉ hóa bằng hostname có thể truy cập từ container, ví dụ
`host.docker.internal` trên Docker Desktop hoặc service name trong Compose.

## Các luồng vận hành

### Test rồi import database

1. CLI chuyển `test` arguments cho Playwright.
2. Playwright chạy reporters theo `playwright.config.ts`.
3. Allure reporter ghi raw results/metadata vào `allure-results`.
4. PostgreSQL reporter đọc result mới, insert run và metadata vào database.
5. CLI kết thúc với exit code của Playwright.

Với `test-and-report`, sau bước 5 CLI tiếp tục đọc run mới nhất trong PostgreSQL
và sinh Allure HTML trước khi trả exit code tổng hợp.

### Sinh report từ database

1. CLI parse `--run-id` và `--output`.
2. Tạo PostgreSQL pool qua `createAllurePostgresPool()`.
3. Repository đọc run cùng test cases, metadata, steps, attachments.
4. Generator dựng Allure input files và gọi Allure CLI `generate`.
5. CLI in run id, test count và đường dẫn `index.html`, sau đó đóng pool.

## Build, entry point và artifact layout

Build local:

```text
npm run build
```

Artifacts trong Docker/image:

```text
dist/cli.js
```

Report mặc định:

```text
allure-db-reports/
├── allure-results-<run_id>/
└── allure-report-<run_id>/
    └── index.html
```

`--output` thay thư mục gốc này; basename `allure-results-<run_id>` và
`allure-report-<run_id>` vẫn do `AllurePostgresReportGenerator` quản lý.

## Kiểm chứng

CLI được kiểm tra qua:

- `npm run build` để compile strict TypeScript.
- `npm run framework -- help` và `npm run framework -- version`.
- `npm run framework -- test --list` để xác nhận argument forwarding.
- `npm run framework -- test-and-report` để chạy suite rồi sinh report khi có DB.
- Giá trị `--run-id` sai định dạng phải làm CLI trả lỗi.

Integration giữa report command với PostgreSQL cần database runtime hợp lệ; có
thể kiểm tra riêng bằng `npm run framework -- report --run-id <id>`.

## Ngoài phạm vi hiện tại

- CLI chưa có subcommand `serve`; report sinh ra là static HTML cần được phục vụ
  bởi web server hoặc tải xuống như CI artifact.
- CLI chưa có quản lý migration/schema command riêng. Schema cho phép được
  quản lý bởi code repository khi insert run.
- Build/push image và registry authentication thuộc pipeline DevOps, không nằm
  trong runtime CLI.
