---
description: "Áp dụng khi tạo, cập nhật hoặc rà soát kiểm thử UI/API bằng Playwright, test spec, page action, API helper và assertion trong repository này."
name: "Quy tắc kiểm thử UI và API bằng Playwright"
applyTo:
  - "tests/**/*.spec.ts"
  - "pages/**/*.ts"
  - "api/**/*.ts"
  - "Helper/API*.ts"
---

# Quy tắc kiểm thử UI và API bằng Playwright

## 1. Làm rõ yêu cầu và xin duyệt

- Không tự quyết định những nội dung ảnh hưởng đáng kể đến thiết kế hoặc việc chạy kiểm thử khi người dùng chưa nêu rõ: phạm vi, hành vi mong đợi, dữ liệu kiểm thử, môi trường, tác động lâu dài hoặc việc có chạy trên hệ thống thật hay không.
- Khi cần lựa chọn, hãy trình bày các phương án dễ hiểu, đề xuất phương án phù hợp nếu hữu ích, rồi hỏi từng câu hỏi cụ thể một. Không hỏi lại những chi tiết triển khai thông thường đã được xác định bởi test case được duyệt hoặc quy ước của repository.
- Trước khi viết hoặc chạy một kiểm thử, phải soạn bảng test case để người dùng xem xét và xác nhận.
- Chưa được tạo hoặc sửa test spec, gửi API request hay thao tác trên UI mục tiêu trước khi người dùng xác nhận rõ các test case.
- Nếu người dùng chưa xác nhận, từ chối hoặc chỉ muốn thảo luận kế hoạch, dừng sau khi trình bày thiết kế; không triển khai hay chạy kiểm thử.
- Xác nhận chỉ áp dụng cho test case và phạm vi đã liệt kê. Nếu môi trường, dữ liệu, hành vi hoặc tác động thay đổi đáng kể, cần xin xác nhận lại.
- Việc duyệt test case không đồng nghĩa với cho phép mua hàng, thanh toán, xóa dữ liệu hoặc thực hiện hành động có hậu quả đáng kể trên hệ thống thật. Với các thao tác đó, cần có ủy quyền riêng.

### Bảng đề xuất test case

| ID | Loại | Kịch bản / mục tiêu | Điều kiện trước và dữ liệu | Các bước | Kết quả mong đợi | Môi trường / tác động phụ |
|---|---|---|---|---|---|---|
| TC-01 | UI / API | Nêu một hành vi cần xác minh | Thiết lập cần thiết; cho biết có tạo hoặc thay đổi dữ liệu không | Các thao tác ngắn, theo thứ tự | Trạng thái UI hoặc response contract có thể quan sát | Local / test / staging / production; ghi rõ thao tác ghi dữ liệu hoặc dọn dẹp |

- Mỗi test case cần độc lập, rõ ràng và đủ nhỏ để người dùng duyệt. Bao gồm trường hợp thành công cùng các trường hợp lỗi/biên liên quan, nhưng không mở rộng quá yêu cầu.
- Với API, ghi method, endpoint, dạng payload (che thông tin bí mật), status mong đợi và các trường response chính.
- Nêu rõ contract chưa xác định, dữ liệu còn thiếu hoặc tác động có thể đáng kể; không tự suy đoán rằng chúng đã được chấp thuận.
- Trình bày bảng và yêu cầu người dùng xác nhận tường minh, ví dụ: “Bạn xác nhận các test case này để mình triển khai và chạy nhé?”. Sau đó dừng và chờ phản hồi.

## 2. Thiết kế và tổ chức test

- Mỗi test tập trung vào một hành vi; đặt tên mô tả kết quả cần kiểm chứng.
- Dùng `test.describe` để nhóm các kịch bản liên quan. Tận dụng fixture hiện có trong `fixtures/` khi chúng cung cấp page object hoặc bước thiết lập phù hợp.
- Đặt assertion trong spec hoặc shared assertion helper đã có. Tránh tạo trùng lặp cho fixture setup, page action, API request wrapper hoặc assertion utility.
- Giữ các test độc lập: không phụ thuộc thứ tự chạy hoặc trạng thái do test khác để lại.
- Ưu tiên chờ theo điều kiện và cơ chế auto-waiting của Playwright thay vì timeout cố định.
- Nếu thay đổi làm phát sinh hoặc điều chỉnh đáng kể kiến trúc framework (ví dụ: test infrastructure dùng chung, fixture, lớp helper, luồng chạy hoặc tích hợp báo cáo), hãy tạo hoặc cập nhật tài liệu thiết kế chi tiết trong `design-doc/` cùng thay đổi. Tài liệu cần nêu mục tiêu, kiến trúc, trách nhiệm thành phần, luồng dữ liệu/điều khiển, tệp bị ảnh hưởng, cấu hình, xử lý lỗi, đánh đổi và cách xác thực.
- Không cần tài liệu thiết kế cho việc thêm test/spec riêng lẻ, sửa lỗi thông thường hoặc refactor cục bộ không làm thay đổi cấu trúc framework.

## 3. Viết kiểm thử UI

- Ưu tiên locator hỗ trợ accessibility như `getByRole`, `getByLabel`, `getByPlaceholder`; dùng test ID ổn định khi giao diện không có locator phù hợp.
- Sau thao tác điều hướng, gửi biểu mẫu, lọc, sắp xếp hoặc tương tác khác, hãy xác minh kết quả mà người dùng có thể nhìn thấy.
- Đặt hành vi trang có thể tái sử dụng trong module tương ứng ở `pages/` và tích hợp theo fixture pattern của repository khi phù hợp.
- Dùng `expect` để kiểm tra trạng thái cụ thể. Click thành công không chứng minh tính năng đã hoạt động.
- Tránh kiểm tra kiểu dáng không liên quan, ID được sinh tự động hoặc nội dung hay thay đổi, trừ khi chính các chi tiết đó là hành vi cần kiểm thử.

## 4. Viết kiểm thử API

- Dùng khả năng API request của Playwright hoặc helper sẵn có trong `Helper/` và `api/`; giữ nguyên quy ước xử lý lỗi và báo cáo hiện có.
- Kiểm tra status, cấu trúc, kiểu dữ liệu và các giá trị quan trọng trong response. Bổ sung trường hợp lỗi khi thuộc hành vi được yêu cầu.
- Kiểm tra response quan sát được, không kiểm tra chi tiết triển khai. Không ghi authorization header, cookie, token hoặc dữ liệu response nhạy cảm vào log.
- Giữ test API ổn định và xác định được kết quả. Dùng dữ liệu riêng khi cần; chỉ dọn dẹp tài nguyên do test tạo nếu việc dọn dẹp an toàn và được hỗ trợ.
- Không gửi request ghi dữ liệu, phá hủy dữ liệu hoặc có tác động lớn đến production hay hệ thống thật khác nếu chưa được ủy quyền rõ ràng.

## 5. Chạy kiểm thử và báo cáo

- Chạy spec hẹp nhất có liên quan trước, ví dụ: `npx playwright test tests/<feature>/<spec>.spec.ts`.
- Playwright Test được cấu hình với `allure-playwright`, lưu kết quả thô vào `allure-results/`. Dùng `test.step()` cho các ranh giới bước/hành động có ý nghĩa để báo cáo Allure dễ đọc. Chỉ thêm label, description hoặc attachment khi chúng giúp chẩn đoán.
- Sau khi chạy test, tạo và mở báo cáo bằng `npm run report:allure`, hoặc chỉ tạo báo cáo bằng `npm run allure:generate`. Báo cáo được ghi vào `allure-report/`.
- Với các lần chạy Playwright Test tự động, dùng Allure làm báo cáo chi tiết. Phiên kiểm tra khám phá bằng Playwright MCP không tự động ghi vào reporter đã cấu hình; không hứa hẹn hoặc gọi đó là kết quả Allure.
- Nếu lỗi do môi trường (mạng, thông tin xác thực, dịch vụ không khả dụng) thay vì assertion, báo là **Blocked** hoặc **Inconclusive** và nêu bằng chứng.
- Trong phần tổng kết, phải phân biệt rõ chạy Playwright Test trong repository với phiên khám phá bằng Playwright MCP; ghi chính xác lệnh/công cụ và vị trí báo cáo Allure nếu có. Không đánh đồng hai loại kết quả.
