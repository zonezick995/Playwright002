# Phân tích requirement: <Tên tính năng>

## 1. Thông tin tài liệu

| Trường | Giá trị |
|---|---|
| Tính năng / ticket | <Tên hoặc mã ticket> |
| Nguồn requirement | <Đường dẫn, ticket hoặc nội dung do người dùng cung cấp> |
| Người yêu cầu / stakeholder | <Tên, nhóm hoặc TBD> |
| Người phân tích | QA/QC |
| Ngày cập nhật | <YYYY-MM-DD> |
| Trạng thái phân tích | Draft / Cần làm rõ / Đã xác nhận |

## 2. Tóm tắt và mục tiêu

- **Bối cảnh:** <Vấn đề hoặc nhu cầu cần giải quyết>
- **Mục tiêu nghiệp vụ:** <Kết quả mong muốn>
- **Người dùng chịu ảnh hưởng:** <Actor/role liên quan>
- **Định nghĩa thành công:** <Kết quả có thể quan sát hoặc đo lường; nếu chưa rõ ghi TBD>

## 3. Phạm vi

### Trong phạm vi

- <Nội dung được yêu cầu>

### Ngoài phạm vi

- <Nội dung không được yêu cầu hoặc đã được xác nhận loại trừ>

### Phụ thuộc

- <Hệ thống, tính năng, dữ liệu, cấu hình hoặc team phụ thuộc; nếu chưa biết ghi TBD>

## 4. Actor và quyền

| Mã | Actor / role | Quyền hoặc mục tiêu | Requirement liên quan |
|---|---|---|---|
| ACT-01 | <Actor/role> | <Mô tả> | REQ-001 |

## 5. Luồng nghiệp vụ

### Luồng chính

1. <Điều kiện bắt đầu>
2. <Hành động và phản hồi hệ thống>
3. <Kết quả cuối>

### Luồng thay thế và ngoại lệ

| Mã | Điều kiện / sự kiện | Hành vi mong đợi | Requirement liên quan |
|---|---|---|---|
| FLOW-ALT-01 | <Điều kiện> | <Phản hồi hệ thống hoặc TBD> | REQ-001 |

## 6. Danh sách requirement

| Mã | Loại | Requirement / quy tắc | Ưu tiên | Acceptance criteria có thể xác minh | Trạng thái / nguồn |
|---|---|---|---|---|---|
| REQ-001 | Functional / Business rule / Data / Interface / Non-functional | <Một yêu cầu rõ ràng> | High / Medium / Low / TBD | Given <điều kiện>, when <hành động>, then <kết quả quan sát được> | Confirmed / TBD; nguồn |

## 7. Quy tắc nghiệp vụ và dữ liệu

### Quy tắc nghiệp vụ

| Mã | Quy tắc | Điều kiện áp dụng | Requirement liên quan | Điểm cần làm rõ |
|---|---|---|---|---|
| BR-001 | <Quy tắc> | <Điều kiện> | REQ-001 | <Không có / câu hỏi> |

### Dữ liệu và validation

| Trường / dữ liệu | Kiểu / định dạng | Bắt buộc | Quy tắc hợp lệ | Hành vi khi không hợp lệ |
|---|---|---|---|---|
| <Tên trường> | <Kiểu> | Yes / No / TBD | <Miền giá trị, giới hạn> | <Thông báo / phản hồi / TBD> |

## 8. Giao diện và tích hợp

| Thành phần / giao diện | Hành vi hoặc contract đã biết | Yêu cầu lỗi / timeout | Requirement liên quan | Trạng thái |
|---|---|---|---|---|
| UI / API / External system | <Chi tiết hoặc TBD> | <Chi tiết hoặc TBD> | REQ-001 | Confirmed / TBD |

## 9. Yêu cầu phi chức năng và vận hành

| Nhóm | Yêu cầu / tiêu chí đo lường | Requirement liên quan | Trạng thái |
|---|---|---|---|
| Hiệu năng | <Ngưỡng đo hoặc TBD> | REQ-001 | Confirmed / TBD / N/A |
| Khả năng tiếp cận / tương thích | <Tiêu chí hoặc TBD> | REQ-001 | Confirmed / TBD / N/A |
| Logging / monitoring | <Sự kiện cần ghi nhận hoặc TBD> | REQ-001 | Confirmed / TBD / N/A |
| Quyền truy cập / dữ liệu | <Quy tắc đã biết hoặc TBD> | REQ-001 | Confirmed / TBD / N/A |

## 10. Rủi ro và câu hỏi mở

### Rủi ro

| Mã | Rủi ro / tác động | Khả năng / mức ảnh hưởng | Requirement liên quan | Cách giảm thiểu / người cần xác nhận |
|---|---|---|---|---|
| RISK-001 | <Mô tả> | High / Medium / Low / TBD | REQ-001 | <Hành động> |

### Câu hỏi cần xác nhận

| Mã | Câu hỏi | Vì sao cần | Requirement liên quan | Mức độ ảnh hưởng | Trạng thái |
|---|---|---|---|---|---|
| Q-001 | <Câu hỏi cụ thể> | <Tác động nếu chưa rõ> | REQ-001 | Blocker / High / Medium / Low | Open / Answered |

## 11. Giả định và nội dung chưa xác nhận

| Mã | Giả định / nội dung TBD | Căn cứ hiện có | Ảnh hưởng nếu sai | Cách xác nhận |
|---|---|---|---|---|
| ASM-001 | <Mô tả; không trình bày như requirement đã xác nhận> | <Nguồn hoặc chưa có> | <Tác động> | <Người/nguồn cần xác nhận> |

## 12. Gợi ý phạm vi QA/QC

Chỉ liệt kê các nhóm cần cân nhắc ở bước thiết kế kiểm thử; đây chưa phải test case đã duyệt.

- <Nhóm hành vi hoặc luồng cần bao phủ> — liên quan: REQ-001
- <Validation, lỗi, phân quyền, dữ liệu hoặc tích hợp cần cân nhắc> — liên quan: REQ-001
- <Nhóm phi chức năng nếu có căn cứ> — liên quan: REQ-001

## 13. Truy vết cho bước tiếp theo

| Requirement | Acceptance criteria | Câu hỏi / rủi ro | Test case ID (điền ở bước sau) | Ghi chú |
|---|---|---|---|---|
| REQ-001 | <AC tương ứng> | Q-001 / RISK-001 | TBD | Chưa thiết kế hoặc duyệt test case |

## 14. Lịch sử cập nhật

| Ngày | Thay đổi | Nguồn xác nhận |
|---|---|---|
| <YYYY-MM-DD> | Tạo bản phân tích | <Nguồn> |
