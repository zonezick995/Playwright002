# Thiết kế phân lớp API Client, Service và Model

## Vấn đề và mục tiêu

Các tiện ích gọi API và assertion trước đây nằm trong `Helper/`, trong khi
repository đã có thư mục `src/api/` chứa bản sao gần như tương đương. Điều này tạo
hai nguồn triển khai, làm khó việc tìm component đúng và tăng nguy cơ sửa một
bản nhưng bỏ sót bản còn lại.

Mục tiêu của thay đổi:

- Tập trung triển khai API vào `src/api/`.
- Tách transport, hành vi service, assertion và kiểu dữ liệu thành component
riêng.
- Giữ các page hiện có tiếp tục gọi API và kiểm tra response theo cùng hành vi.
- Giữ đường dẫn `src/api/baseApi` và `src/api/baseAssert` làm lớp re-export để các
consumer hiện hữu không phải thay đổi ngay.

## Phạm vi và cấu trúc

```text
src/
├── api/
│   ├── business/
│   │   ├── add-place.business.ts
│   │   └── clms-login.business.ts
│   ├── client/
│   │   └── api-client.ts
│   ├── models/
│   │   ├── api-request.model.ts
│   │   └── api-response.model.ts
│   ├── services/
│   │   ├── api.service.ts
│   │   └── api-assertion.service.ts
│   ├── index.ts
│   ├── baseApi.ts
│   └── baseAssert.ts
└── fixtures/
    └── api.fixtures.ts
```

Các thành phần framework còn lại như `src/pages/` và `src/Helper/` cũng nằm
trong `src/`.

Các file `Helper/APIHelper.ts` và `Helper/APIAssert.ts` được loại bỏ sau khi
Caller chuyển sang import từ `src/api/`. API spec lấy service qua
`src/fixtures/api.fixtures.ts` rồi gọi use-case trong `src/api/business/`; phần xử lý
API không còn nằm trong page object hoặc spec. Những utility dùng chung như
logger và Allure helper nằm trong `src/Helper/`; API client gọi chúng thay vì sao
chép chức năng.

## Trách nhiệm component

### `src/api/client/api-client.ts`

- Thực hiện HTTP request bằng `APIRequestContext` của Playwright.
- Xử lý method, URL/query params, header, body, timeout và retry.
- Thay placeholder trong request body khi `bodyParams` được cấu hình.
- Đọc response body, parse JSON theo `Content-Type` khi được yêu cầu.
- Gắn request/response vào Allure, ghi log và ném lỗi khi response không thành
công.
- Đóng API request context trong `finally`.

### `src/api/business/`

- Chứa các thao tác nghiệp vụ/use-case API có thể được gọi lại từ spec.
- `add-place.business.ts` sở hữu cấu hình endpoint, payload và headers để tạo
địa điểm; spec chỉ gọi use-case và assert response.
- `clms-login.business.ts` đóng gói request đăng nhập CLMS; thông tin đăng nhập
được truyền vào từ biến môi trường trong spec, không hard-code trong business
logic.
- Business action nhận `ApiService` từ fixture thay vì tự khởi tạo request
context hoặc phụ thuộc vào Playwright `page`.

### `src/api/services/api.service.ts`

- Cung cấp facade cấp service cho các method `request`, `get`, `post`, `put`
và `delete`.
- Ủy quyền transport cho `ApiClient`; không tự chứa logic HTTP.
- Dùng overload theo `returnResponse` để thể hiện kiểu trả về là body hoặc
`ApiResponse<T>`.

### `src/api/services/api-assertion.service.ts`

- Cung cấp assertion cho status code, body dạng object/array, kiểu field và
giá trị field.
- Dùng `expect` và `test.step()` để kết quả assertion xuất hiện rõ trong
Playwright/Allure.
- Ghi log lỗi assertion rồi ném lại lỗi để test vẫn thất bại đúng trạng thái.

### `src/api/models/`

- `api-request.model.ts`: định nghĩa method HTTP được hỗ trợ và các tùy chọn
request.
- `api-response.model.ts`: định nghĩa response, kiểu dữ liệu field và quy tắc
assertion.

### `src/api/index.ts` và lớp tương thích

- `src/api/index.ts` là điểm import tập trung cho service, assertion và model.
- `src/api/baseApi.ts` và `src/api/baseAssert.ts` chỉ re-export API mới để giữ
các import tương thích hoạt động.
- Alias `ApiHelper` được giữ cho service để hỗ trợ consumer cũ; mã mới nên
dùng tên `ApiService`.

### `src/fixtures/api.fixtures.ts`

- Tạo API test fixture riêng, không phụ thuộc vào `page` hay page object.
- Cung cấp `ApiService` dưới fixture `api` để spec gọi endpoint qua cùng API
client/service đã phân lớp.
- API spec import `test` và `expect` từ fixture này; UI spec tiếp tục dùng
`pom.fixtures.ts`.

## Luồng dữ liệu

1. API spec import fixture `api` từ `src/fixtures/api.fixtures.ts`; fixture cung
cấp `ApiService` cho business action.
2. Spec gọi use-case trong `src/api/business/`, truyền fixture `api` cùng dữ liệu
được phép; business action chuẩn bị endpoint, payload và headers.
3. Business action gọi `ApiService`, chuyển method, URL và
`ApiRequestOptions` tới `ApiClient`.
4. `ApiClient` chuẩn bị URL/body/header, gửi request, ghi nhận request/response
cho Allure và chuyển body đã parse về caller.
5. Khi response được yêu cầu ở dạng đầy đủ, client trả
`{ statusCode, body }`; nếu không, client trả body.
6. Spec truyền response tới các hàm trong `api-assertion.service.ts`; các
hàm này xác minh contract đã được test chỉ định.

Trong spec, service được lấy từ fixture, use-case và assertion được import từ
`src/api/`:

```ts
import { test } from '../../src/fixtures/api.fixtures';
import { assertApiResponse, createPlace } from '../../src/api';

test('creates a place successfully', async ({ api }) => {
  const response = await createPlace(api);
  await assertApiResponse(response, { statusCode: 200 });
});
```

## Tương thích và thay đổi hành vi

- Các page không còn chứa luồng kiểm thử API; API spec gọi business action qua
fixture riêng và assertion từ `src/api/`. Case CLMS Login API vẫn giữ trạng thái
`skip` như trước khi chuyển khỏi UI spec.
- Các entry point `src/api/baseApi` và `src/api/baseAssert` giữ vai trò re-export,
không còn chứa bản sao logic.
- Query params chỉ được thêm vào URL một lần. Trước đó params vừa được ghép
vào URL vừa được truyền lại cho Playwright request context, có thể tạo query
parameter lặp.
- Quy tắc timeout mặc định, retry, parse JSON, Allure attachment, logging và
xử lý non-2xx tiếp tục được giữ.

## Cấu hình

Không bổ sung package hoặc cấu hình mới. Client tiếp tục sử dụng `@playwright/test`,
`src/Helper/AllureHelper` và `src/Helper/utils/logger`. Base URL, headers, timeout,
retry và body được cung cấp qua `ApiRequestOptions` tại nơi gọi.

## Xử lý lỗi

- Lỗi request hoặc response không thành công được thử lại theo `retries`;
khi hết lượt, lỗi cuối được ném ra.
- Lỗi parse JSON được ghi cảnh báo; response body văn bản vẫn được trả về,
giống hành vi trước đó.
- Lỗi assertion được ghi log và ném lại, không biến thành kết quả thành công.
- Request context luôn được dispose trong `finally`.

## Quyết định và đánh đổi

- Giữ service ở dạng static facade để hạn chế thay đổi đối với cách gọi API
hiện tại; chưa thêm dependency injection hoặc cấu hình client toàn cục.
- Tách assertion thành service riêng vì nó phụ thuộc Playwright `expect` và
`test.step`, không thuộc trách nhiệm transport.
- Dùng barrel `src/api/index.ts` cho import mới; giữ hai file `base*` làm lớp
tương thích để tránh thay đổi rộng hơn phạm vi migration.
- Không chuyển logger hoặc Allure helper vào `api/` vì đó là tiện ích dùng
chung ngoài API.

## Tệp bị ảnh hưởng

- Thêm business action, client, service, model và barrel export trong `src/api/`.
- Thay nội dung `src/api/baseApi.ts` và `src/api/baseAssert.ts` bằng re-export.
- Xóa hai bản helper trùng trong `src/Helper/`.
- Cập nhật API spec, `src/fixtures/api.fixtures.ts` và `src/fixtures/pom.fixtures.ts`.
- Chuyển Add Place và CLMS Login API ra khỏi page object để page module chỉ
phụ trách hành vi UI.
- Cập nhật instruction/skill để chỉ vị trí API component mới.

## Xác thực

- `git diff --check` để kiểm tra whitespace.
- `npx tsc -p . --noEmit --ignoreDeprecations 5.0` để type-check dự án.
- Không chạy spec gọi hệ thống API bên ngoài trong lần refactor này. Lệnh
`npm run build` mặc định hiện bị chặn bởi `tsconfig.json` đặt
`ignoreDeprecations: "6.0"`, giá trị mà TypeScript đang dùng báo không hợp lệ.
