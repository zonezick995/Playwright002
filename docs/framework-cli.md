# Hướng dẫn sử dụng Framework CLI

CLI cung cấp một điểm gọi thống nhất để chạy Playwright test và sinh Allure HTML
report từ PostgreSQL.

## Yêu cầu

- Node.js phiên bản tương thích với project.
- Dependencies đã cài bằng `npm ci`.
- Chromium đã được cài cho Playwright nếu chạy browser tests.
- PostgreSQL có thể truy cập nếu dùng lệnh `report`.

## Chạy CLI trong project

Build CLI trước khi chạy:

```powershell
npm ci
npm run build
```

CLI có thể chạy qua npm script:

```powershell
npm run framework -- <command> [options]
```

Hoặc gọi file đã build:

```powershell
node dist/cli.js <command> [options]
```

Xem danh sách command:

```powershell
npm run framework -- help
npm run framework -- version
```

## Chạy Playwright tests

Các đối số sau `test` được chuyển tiếp cho Playwright Test CLI; Playwright vẫn
dùng cấu hình trong `playwright.config.ts`:

```powershell
npm run framework -- test
npm run framework -- test tests/heroTestCase/api-test.spec.ts --project=chromium
npm run framework -- test tests/allure --list
```

Lệnh này trả về exit code của Playwright để CI nhận biết test pass/fail. Không
thêm `--reporter=line` nếu muốn giữ lại các reporters đã khai báo trong config;
nếu cần reporter bổ sung, ưu tiên `--add-reporter`.

## Chạy toàn bộ test rồi sinh report

CLI chạy toàn bộ suite Playwright trước, sau đó sinh Allure HTML từ run vừa được
reporter ghi vào PostgreSQL:

```powershell
npm run framework -- test-and-report
```

Docker image dùng command này làm mặc định. Vì vậy lệnh dưới đây sẽ chạy test
toàn bộ rồi sinh report:

```powershell
docker run --rm --env-file .env.docker pw-framework:local
```

Command `test-and-report` vẫn thử sinh report nếu test có lỗi, nhưng container
trả exit code khác 0 nếu test hoặc bước sinh report thất bại. Kết nối PostgreSQL
phải được cấu hình để reporter lưu run và CLI đọc lại dữ liệu.

## Sinh report từ PostgreSQL

Lệnh mặc định đọc run mới nhất:

```powershell
npm run framework -- report
```

Chọn run cụ thể và thư mục output:

```powershell
npm run framework -- report --run-id 15 --output .\artifacts\reports
```

`--run-id` phải là số nguyên dương an toàn. Nếu bỏ `--output`, thư mục mặc định
là `allure-db-reports` tại working directory hiện tại.

Report được tạo tại:

```text
<output-directory>/allure-report-<run_id>/index.html
```

Ví dụ với run 15 và output mặc định:

```text
allure-db-reports/allure-report-15/index.html
```

Command `report` sinh report nhưng không tự mở browser.

## Cấu hình PostgreSQL

Pool đọc các biến kết nối theo thứ tự:

1. `DATABASE_URL`, nếu được khai báo.
2. Các biến `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`.

Khi chạy local, có thể dùng file `.env.postgres.local` ở root project. File này
chứa secrets và không được commit. Trong CI hoặc container, cung cấp cùng biến
qua secret/environment injection. Nếu PostgreSQL chạy trên máy host Windows,
địa chỉ từ container thường là `host.docker.internal`, không phải `localhost`.

## Chạy bằng Docker

Build image từ root project:

```powershell
docker build -t pw-framework:local .
```

Mặc định container chạy toàn bộ tests và sinh report. Có thể truyền framework
command trực tiếp sau tên image để ghi đè `CMD`:

```powershell
docker run --rm --env-file .env.docker pw-framework:local help
docker run --rm --env-file .env.docker pw-framework:local test --project=chromium
docker run --rm --env-file .env.docker pw-framework:local report --run-id 15
```

Để mở shell tương tác bên trong container, dùng `shell` và cấp pseudo-TTY:

```powershell
docker run --rm -it --env-file .env.docker pw-framework:local shell
```

Shell mở ở `/app`. Có thể chạy command shell không tương tác bằng:

```powershell
docker run --rm pw-framework:local shell -lc "node --version && java -version"
```

Để sinh report và giữ file trên host, mount thư mục artifacts. Ví dụ PowerShell:

```powershell
New-Item -ItemType Directory -Force .\artifacts | Out-Null
docker run --rm --env-file .env.docker `
  -v "${PWD}\artifacts:/artifacts" `
  pw-framework:local report --run-id 15 --output /artifacts
```

Tạo `.env.docker` bên ngoài image, đặt các biến PostgreSQL phù hợp và không
commit file đó. Khi database chạy trên Windows host, ví dụ:

```dotenv
PGHOST=host.docker.internal
PGPORT=5432
PGDATABASE=your_database
PGUSER=your_user
PGPASSWORD=your_password
```

Không truyền credentials bằng Docker build arguments và không đưa file `.env`
thật vào image. Nếu test ứng dụng nằm trong container khác, cấu hình `BASE_URL`
theo DNS/service name có thể truy cập từ container test.

## Command hiện có

| Command | Mô tả |
| --- | --- |
| `help` | Hiển thị trợ giúp và ví dụ. |
| `version` | Hiển thị version trong `package.json`. |
| `test [args...]` | Chuyển tiếp đối số cho `playwright test`. |
| `test-and-report` | Chạy toàn bộ suite rồi sinh Allure HTML từ PostgreSQL. |
| `report [--run-id <id>] [--output <dir>]` | Sinh Allure HTML từ PostgreSQL. |
