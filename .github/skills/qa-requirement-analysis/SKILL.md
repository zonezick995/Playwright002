---
name: qa-requirement-analysis
description: "Đóng vai QA/QC để phân tích, làm rõ và chuẩn hóa requirement từ mô tả, tài liệu hoặc ticket; tạo tài liệu Markdown có thể tái sử dụng cho thiết kế test case và các bước QA tiếp theo."
argument-hint: "Requirement, ticket, tài liệu hoặc đường dẫn tính năng cần phân tích"
---

# Phân tích requirement theo vai trò QA/QC

Skill này chuyển requirement đầu vào thành một tài liệu phân tích có cấu trúc, làm nguồn tham chiếu thống nhất cho thiết kế test case, review, triển khai và xác nhận sau đó.

## Khi sử dụng

- Người dùng yêu cầu phân tích requirement, đặc tả tính năng, ticket, user story hoặc acceptance criteria.
- Người dùng muốn chuẩn hóa yêu cầu trước khi thiết kế test case hay bắt đầu kiểm thử.
- Người dùng muốn tạo tài liệu `.md` dùng lại qua nhiều bước QA/QC.

## Phạm vi và nguyên tắc

- Phân tích requirement dựa trên nội dung người dùng cung cấp và tài liệu trong repository được yêu cầu hoặc có liên quan trực tiếp.
- Tách biệt điều đã xác nhận với suy luận, giả định và thông tin chưa rõ. Không tự biến giả định thành requirement.
- Giữ nguyên ý nghĩa nghiệp vụ; chỉ ra mâu thuẫn, thiếu điều kiện, thuật ngữ mơ hồ, luồng chưa xác định và tiêu chí chưa đo lường được.
- Gán mã ổn định cho requirement, quy tắc nghiệp vụ, câu hỏi và rủi ro để các bước sau có thể tham chiếu.
- Không tự thiết kế test case chi tiết, viết/sửa test spec, gửi API request, truy cập website hoặc chạy kiểm thử trong skill này.
- Không tự đưa ra quyết định nghiệp vụ thay người dùng. Nếu cần lựa chọn ảnh hưởng đáng kể, ghi thành câu hỏi mở và xin làm rõ khi câu trả lời cần thiết để hoàn tất phân tích.
- Không đưa credential, token, cookie, dữ liệu cá nhân hoặc bí mật vào tài liệu. Che hoặc loại bỏ dữ liệu nhạy cảm.

## Quy trình

1. **Thu thập đầu vào:** xác định nguồn requirement, tên tính năng/ticket, mục tiêu, người dùng liên quan và phạm vi được yêu cầu phân tích. Nếu thiếu thông tin, tiếp tục phân tích phần đã biết và đánh dấu phần còn thiếu là `TBD`.
2. **Phân rã yêu cầu:** tách mục tiêu, actor/role, luồng chính, luồng thay thế, quy tắc nghiệp vụ, dữ liệu, tích hợp, trạng thái và hành vi lỗi thành các mục nhỏ, có thể truy vết.
3. **Đánh giá khả năng kiểm chứng:** kiểm tra mỗi requirement có điều kiện, hành động và kết quả mong đợi đủ rõ hay không; xác định tiêu chí chấp nhận chưa đo lường được hoặc thiếu điều kiện biên.
4. **Phân tích ảnh hưởng QA/QC:** nêu các nhóm cần xem xét như UI, API, dữ liệu, quyền truy cập, tương thích, hiệu năng, khả năng tiếp cận, logging và xử lý lỗi nếu chúng có liên quan. Không khẳng định phạm vi kiểm thử hoặc mức độ bảo mật chưa được yêu cầu.
5. **Ghi nhận điểm chưa rõ:** lập danh sách câu hỏi cần xác nhận, giả định tạm thời, rủi ro, phụ thuộc và nội dung ngoài phạm vi. Đánh dấu mức độ ảnh hưởng và requirement liên quan.
6. **Tạo tài liệu Markdown:** sao chép cấu trúc từ [mẫu phân tích requirement](./assets/requirement-analysis-template.md), điền nội dung và lưu theo quy ước bên dưới.
7. **Kiểm tra trước khi hoàn tất:** xác minh mã tham chiếu không trùng, trạng thái đã biết/chưa biết được phân biệt rõ, liên kết truy vết nhất quán và không có bí mật hoặc giả định trình bày như sự thật.
8. **Báo cáo:** cho biết đường dẫn tài liệu đã tạo, nguồn requirement đã dùng, các điểm còn `TBD` quan trọng và bước tiếp theo phù hợp. Nếu câu hỏi mở ngăn cản kết luận có ý nghĩa, nêu rõ cần người dùng trả lời.

## Cấu trúc và nơi lưu kết quả

- Mặc định lưu tại `design-docs/qa-requirements/<feature-slug>-requirement-analysis.md`.
- Dùng tên tính năng/ticket dạng kebab-case, ví dụ `account-lockout-requirement-analysis.md`. Nếu người dùng chỉ định đường dẫn khác thì dùng đường dẫn đó.
- Nếu thư mục chưa tồn tại, tạo thư mục cần thiết; không ghi đè tài liệu đã có nếu chưa kiểm tra nội dung. Khi tài liệu cùng tên đã tồn tại, cập nhật tài liệu đó nếu thuộc cùng requirement; nếu không chắc, hỏi người dùng hoặc dùng hậu tố phân biệt.
- Viết tài liệu bằng tiếng Việt; giữ nguyên tên sản phẩm, identifier, mã requirement, API/path và technical term tiếng Anh khi cần để tránh sai nghĩa.
- Dùng các mục trong mẫu; mục nào không áp dụng thì ghi `Không áp dụng` kèm lý do ngắn. Mục chưa thể kết luận phải ghi `TBD` và nêu thông tin cần bổ sung.

## Đầu vào từ các bước trước và bàn giao

- Nếu có tài liệu phân tích requirement trước đó, đọc và cập nhật đúng tài liệu thay vì tạo bản sao mới.
- Khi người dùng yêu cầu thiết kế test case tiếp theo, bàn giao tài liệu này làm nguồn requirement; giữ liên kết từ test case tới mã requirement và acceptance criteria tương ứng.
- Nếu người dùng gọi riêng skill thiết kế test case, skill đó vẫn phải tuân thủ phạm vi chỉ thiết kế và quy trình xin duyệt hiện hành.
- Chỉ đánh dấu requirement “đã xác nhận” khi có căn cứ từ nguồn đầu vào hoặc xác nhận rõ của người dùng. Tài liệu này là đặc tả làm việc, không tự thay thế quyết định phê duyệt nghiệp vụ.
