---
name: playwright-mcp-qa
description: "Dùng để kiểm tra khám phá UI bằng Playwright MCP, thiết kế hoặc thực hiện tự động hóa UI/API lặp lại bằng Playwright Test, và báo cáo kết quả QA trong repository này."
argument-hint: "URL website hoặc tính năng cùng hành vi UI/API cần xác minh"
---

# Kiểm thử khám phá và QA với Playwright

Dùng quy trình này khi người dùng muốn kiểm tra website, khám phá luồng UI bằng MCP hoặc xây dựng kiểm thử UI/API có thể lặp lại trong repository.

Nếu người dùng chỉ yêu cầu thiết kế test case hoặc gọi `/playwright-testcase-design`, hãy dùng [skill chỉ thiết kế test case](../playwright-testcase-design/SKILL.md). Dừng sau khi trình bày test case; không triển khai hay chạy.

Nếu người dùng yêu cầu phân tích requirement trước khi kiểm thử, hãy dùng [skill phân tích requirement QA/QC](../qa-requirement-analysis/SKILL.md) để tạo tài liệu Markdown làm đầu vào cho các bước tiếp theo.

Nếu người dùng yêu cầu triển khai test case đã duyệt thành code tự động hóa UI/API, dùng [skill triển khai test case](../playwright-testcase-implementation/SKILL.md).

## 1. Chọn cách kiểm thử

- **Kiểm tra UI khám phá trên website thật:** dùng trình duyệt Playwright MCP được kết nối để mở và thao tác với website đã được duyệt.
- **Kiểm thử hồi quy UI có thể lặp lại:** tạo hoặc chạy Playwright Test spec trong `tests/`, sử dụng fixture và page action hiện có.
- **Tự động hóa API:** tạo hoặc chạy Playwright Test API spec bằng request facility của Playwright hoặc client/service sẵn có trong `api/`.
- Trình duyệt MCP không phải Playwright Test runner. Không nói rằng thao tác MCP đã chạy spec hoặc tạo kết quả của một lần chạy kiểm thử tự động.
- Chỉ dùng network inspection để hiểu request do UI gửi; không xem đó là thay thế cho assertion API contract.

## 2. Xác định phạm vi và xin duyệt

1. Làm rõ URL hoặc endpoint API, tính năng, môi trường và mục tiêu: kiểm tra khám phá bằng MCP hay xây dựng/chạy Playwright Test có thể lặp lại.
2. Nếu có lựa chọn ảnh hưởng đáng kể nhưng chưa rõ, hãy nêu các phương án thực tế, đề xuất nếu hữu ích và hỏi từng câu một. Không truy cập hoặc thay đổi hệ thống mục tiêu để tự khám phá hành vi trước khi được duyệt.
3. Soạn và trình bày bảng test case để người dùng xem xét trước khi triển khai hoặc thực thi:

   | ID | Loại | Kịch bản / mục tiêu | Điều kiện trước và dữ liệu | Các bước | Kết quả mong đợi | Môi trường / tác động phụ |
   |---|---|---|---|---|---|---|
   | TC-01 | UI / API | Một hành vi cần kiểm tra | Thiết lập và dữ liệu cần thiết | Thao tác ngắn gọn | Kết quả có thể quan sát | Môi trường đích và tác động phụ |

4. Với API, nêu method, endpoint, dạng payload (che thông tin bí mật), status mong đợi và các trường response chính. Với UI, nêu trạng thái cần thấy cùng điều kiện trước liên quan.
5. Yêu cầu người dùng xác nhận rõ các test case, sau đó dừng và chờ. Chưa được tạo/sửa spec, mở hoặc thao tác website, hay gửi request trước khi có xác nhận.
6. Nếu người dùng không xác nhận, từ chối hoặc chỉ muốn đề xuất, không triển khai và không chạy. Nếu phạm vi, dữ liệu hoặc môi trường thay đổi đáng kể, hãy trình bày lại test case để xác nhận.
7. Sự chấp thuận chỉ bao gồm các test case đã liệt kê. Không coi đó là sự cho phép mua hàng, thanh toán, xóa dữ liệu hoặc hành động có hậu quả đáng kể trên hệ thống thật; cần được ủy quyền riêng.

## 3. Thực hiện kiểm tra UI bằng MCP

Sau khi được duyệt:

1. Mở URL đã duyệt bằng trình duyệt Playwright MCP; xác minh URL cuối, tiêu đề trang và nội dung chính trước khi thao tác.
2. Tìm điều khiển bằng accessible role, label hoặc placeholder.
3. Thực hiện từng hành động có ý nghĩa một lần; sau đó kiểm tra URL, trạng thái hiển thị, thông báo hoặc thay đổi dữ liệu/sản phẩm tương ứng.
4. Khi phù hợp, ghi nhận lỗi console hoặc network; phân biệt lỗi của hệ thống cần kiểm tra với lỗi không liên quan từ bên thứ ba.

## 4. Triển khai hoặc chạy kiểm thử API

- Xác định endpoint, method, đầu vào bắt buộc, status mong đợi và response contract từ repository hoặc ngữ cảnh kiểm thử đã được phép sử dụng.
- Dùng Playwright Test spec và API client/service/assertion sẵn có trong `api/` khi phù hợp.
- Kiểm tra status, cấu trúc response và các trường quan trọng. Cô lập dữ liệu kiểm thử; chỉ dọn dẹp tài nguyên do test tạo khi việc đó an toàn.
- Không thực hiện thao tác ghi hoặc phá hủy dữ liệu chưa được duyệt trên hệ thống thật.
- Nếu chuyển một phát hiện khám phá thành kiểm thử hồi quy, đặt spec trong thư mục tính năng phù hợp dưới `tests/` và tuân theo [instruction kiểm thử Playwright](../../instructions/playwright-tests.instructions.md).

## 5. An toàn và bảo vệ dữ liệu

- Không mua hàng, thanh toán, tạo tài khoản, gửi biểu mẫu có hậu quả hoặc thực hiện thay đổi phá hủy trên website thật nếu chưa được ủy quyền rõ ràng.
- Không để lộ thông tin xác thực, token, cookie, dữ liệu cá nhân hoặc payload API nhạy cảm trong ảnh chụp, log hay báo cáo cuối.
- Nếu chưa rõ quyền thực hiện bước xác nhận có hậu quả, hãy dừng trước bước đó.

## 6. Đánh giá kết quả và báo cáo

- Đánh dấu từng test case được duyệt là **Pass**, **Fail** hoặc **Blocked**. Nêu bằng chứng quan sát được, công cụ đã dùng (MCP hay Playwright Test) và giới hạn như thiếu thông tin xác thực hoặc dịch vụ bên thứ ba không ổn định.
- Với lần chạy Playwright Test, dùng Allure làm báo cáo chi tiết: kết quả thô ở `allure-results/`; chạy `npm run report:allure` để tạo và mở báo cáo hoặc `npm run allure:generate` để chỉ tạo báo cáo. Nêu lệnh và vị trí báo cáo.
- Phiên MCP khám phá không tự động được ghi vào Allure. Hãy tóm tắt trực tiếp kết quả khám phá; không gọi bản tóm tắt đó là báo cáo Allure hay báo cáo của lần chạy test tự động.
- Không kết luận **Pass** chỉ vì trang tải được hoặc nút có thể bấm. Tách riêng vấn đề của sản phẩm với lỗi môi trường hoặc bên thứ ba.

### Bảng kết quả kiểm tra khám phá MCP

| # | Test case | Kết quả | Bằng chứng / ghi chú |
|---|---|---|---|
| 1 | Mô tả hành vi đã kiểm tra | Pass / Fail / Blocked | Nêu bằng chứng UI hoặc response thực tế |

### Tóm tắt lần chạy tự động

Nêu lệnh Playwright Test và kết quả, sau đó dẫn tới báo cáo Allure đã tạo cùng vị trí lưu. Tóm tắt các trường hợp lỗi/bị chặn và bằng chứng chính; dùng Allure cho chi tiết từng bước, attachment và chẩn đoán thay vì chép lại toàn bộ báo cáo vào chat.
