# Hướng dẫn Copilot cho repository Playwright

## Quy tắc chung

- Tổ chức các kịch bản tự động trong `tests/`, nhóm theo tính năng.
- Tái sử dụng fixture trong `fixtures/`, page action trong `pages/` và API helper/assertion trong `Helper/` hoặc `api/` khi phù hợp; không tạo tiện ích trùng lặp.
- Tuân theo quy ước TypeScript và Playwright Test hiện có.
- Mỗi test cần độc lập, tập trung vào hành vi cụ thể và xác minh kết quả quan sát được. Ưu tiên điều kiện chờ rõ ràng thay vì thời gian chờ cố định.

## Thiết kế, phê duyệt và thực thi kiểm thử

- Trước khi triển khai hoặc chạy một kiểm thử được yêu cầu, hãy trình bày bảng test case ngắn gọn để người dùng xác nhận. Chưa xác nhận thì không sửa spec, gửi request hoặc thao tác hệ thống đích.
- Nếu người dùng không xác nhận hoặc chỉ muốn thiết kế test case, dừng ở phần đề xuất; không triển khai hay thực thi.
- Khi người dùng gọi `/playwright-testcase-design` hoặc chỉ yêu cầu thiết kế/soạn test case, dùng [skill thiết kế test case](./skills/playwright-testcase-design/SKILL.md). Đây là quy trình chỉ thiết kế: không triển khai spec và không truy cập hệ thống đích.
- Với kiểm thử hồi quy UI/API có thể lặp lại, dùng Playwright Test spec và chạy lệnh hẹp nhất liên quan.
- Khi người dùng yêu cầu kiểm tra website trực tiếp theo kiểu khám phá, dùng trình duyệt Playwright MCP. Tương tác bằng MCP không tương đương với chạy spec trong repository.
- Dùng API facility của Playwright Test hoặc API helper hiện có để assertion tự động cho API. Không khẳng định thao tác trình duyệt MCP đã chạy API test spec.
- Việc duyệt kế hoạch test không tự động cho phép mua hàng, thanh toán, tạo tài khoản, xóa dữ liệu hoặc hành động có hậu quả đáng kể trên hệ thống thật; phải có ủy quyền riêng.

## An toàn dữ liệu và tác động

- Giữ test độc lập và tránh làm thay đổi trạng thái dùng chung ngoài phạm vi được duyệt.
- Không đưa credential, token, cookie hoặc thông tin nhạy cảm vào mã nguồn, log, ảnh chụp hay báo cáo. Dùng biến môi trường đã cấu hình và che dữ liệu cần thiết.
- Chỉ dọn dẹp tài nguyên do test tạo khi việc dọn dẹp an toàn và được hỗ trợ.

## Báo cáo và tài liệu thiết kế

- Sau khi thay đổi mã kiểm thử, chạy test Playwright nhỏ nhất có liên quan.
- Với lần chạy Playwright Test, dùng Allure đã cấu hình làm báo cáo chi tiết; ghi lệnh chạy và vị trí kết quả/báo cáo.
- Với kiểm tra khám phá bằng MCP, tóm tắt kết quả trong chat. Không nói rằng hoạt động MCP được ghi vào Allure nếu không có lần chạy Playwright Test tương ứng.
- Nêu trạng thái **Pass**, **Fail** hoặc **Blocked** cùng giới hạn liên quan. Không trình bày kiểm tra khám phá như một lần chạy test tự động thành công.
- Nếu thay đổi làm thay đổi đáng kể cấu trúc hoặc kiến trúc framework (ví dụ: shared layer, module boundary, execution flow, fixture system hoặc reporting integration), hãy tạo hoặc cập nhật tài liệu thiết kế chi tiết trong `design-doc/` trong cùng thay đổi. Viết tài liệu bằng tiếng Việt; chỉ giữ tiếng Anh cho technical term, tên thư viện, identifier, code hoặc thuật ngữ dịch sang tiếng Việt sẽ kém rõ ràng.
- Tài liệu thiết kế cần nêu vấn đề và mục tiêu, kiến trúc, trách nhiệm thành phần, luồng tương tác/dữ liệu, tệp bị ảnh hưởng, cấu hình, xử lý lỗi, quyết định và đánh đổi, cùng cách xác thực.
- Không cần tài liệu thiết kế cho test case riêng lẻ, sửa lỗi thông thường hoặc refactor cục bộ không làm thay đổi cấu trúc framework. Nếu chưa rõ thay đổi có mang tính kiến trúc hay không, hỏi người dùng trước.

## Tài liệu Playwright liên quan

- Khi tạo, cập nhật hoặc rà soát test spec, page action, API helper hay assertion, tham khảo [instruction kiểm thử Playwright](./instructions/playwright-tests.instructions.md).
- Khi kiểm tra khám phá website bằng Playwright MCP hoặc thực hiện quy trình QA UI/API, dùng [skill Playwright MCP QA](./skills/playwright-mcp-qa/SKILL.md).
- Khi chỉ thiết kế test case, dùng [skill thiết kế test case](./skills/playwright-testcase-design/SKILL.md).
