---
name: database-testing
description: "Thiết kế, triển khai hoặc thực thi kiểm thử database trong repository này bằng Playwright Test và các fixture/helper hiện có."
argument-hint: "Database, luồng dữ liệu hoặc test case database cần kiểm tra"
---

# Kiểm thử database

Dùng skill này khi người dùng muốn kiểm tra kết nối, truy vấn, schema hoặc tính đúng đắn của dữ liệu được lưu trong database. Skill này áp dụng cho kiểm thử database trực tiếp và kiểm thử tích hợp cần đối chiếu dữ liệu persistence.

## 1. Xác định phạm vi và xin duyệt

1. Làm rõ database/driver, chức năng hoặc dữ liệu cần kiểm tra, môi trường, điều kiện trước và kết quả mong đợi. Phân biệt kiểm tra kết nối chỉ đọc với kịch bản có ghi, cập nhật hoặc xóa dữ liệu.
2. Kiểm tra thông tin trong repository trước khi hỏi lại: `src/Helper/utils/db/DatabaseFactory.ts`, `src/fixtures/db.fixtures.ts`, các spec trong `tests/database/` và cấu hình/lệnh test trong `package.json`.
3. Không giả định database mặc định, tên schema/bảng, contract nghiệp vụ, quyền truy cập hoặc tính an toàn của môi trường. Nếu thiếu thông tin thiết yếu, hỏi một câu làm rõ hoặc đánh dấu **TBD**.
4. Trước khi tạo/sửa spec hoặc kết nối tới database để chạy test, trình bày bảng test case và yêu cầu người dùng xác nhận rõ:

   | ID | Database / loại | Kịch bản / mục tiêu | Điều kiện trước và dữ liệu | Các bước / truy vấn kiểm tra | Kết quả mong đợi | Môi trường / tác động |
   |---|---|---|---|---|---|---|
   | DB-01 | Driver, schema hoặc bảng đã xác định | Một hành vi cần xác minh | Database và dữ liệu chuẩn bị | Thao tác và cách xác minh | Kết quả quan sát được | Local / test / staging / production / TBD; ghi rõ có ghi/xóa dữ liệu không |

5. Test case phải chỉ rõ dữ liệu bị tạo hoặc thay đổi, phạm vi cleanup và liệu có dùng database dùng chung hay không. Việc duyệt test case không thay thế ủy quyền riêng cho thao tác có hậu quả đáng kể trên hệ thống thật.
6. Chưa có xác nhận thì dừng ở đề xuất: không sửa spec, mở kết nối hoặc chạy truy vấn.

## 2. An toàn database và dữ liệu

- Mặc định ưu tiên truy vấn chỉ đọc. Không chạy `INSERT`, `UPDATE`, `DELETE`, DDL, migration hoặc stored procedure có side effect khi chưa được nêu trong case đã duyệt và được phép trên môi trường đó.
- Không chạy test ghi/xóa trên production hoặc database dùng chung nếu chưa có ủy quyền rõ ràng. Khi môi trường hoặc quyền hạn chưa xác định, dừng và hỏi.
- Chỉ lấy thông tin kết nối từ biến môi trường/cơ chế cấu hình an toàn đã có. Không ghi credential, connection string, token, dữ liệu cá nhân hoặc giá trị nhạy cảm vào source, log, attachment hay báo cáo.
- Dùng parameter binding cho giá trị đầu vào; không nối chuỗi để tạo SQL từ dữ liệu test. Chỉ kiểm tra SQL động khi đó là hành vi cần thiết và đã được phê duyệt.
- Cô lập dữ liệu test bằng khóa/định danh riêng khi phù hợp. Không dựa vào trạng thái do test khác tạo hoặc xóa dữ liệu không thuộc test.
- Chỉ cleanup dữ liệu do chính test tạo nếu thao tác được duyệt, có phạm vi xác định và an toàn. Nếu transaction được driver/ứng dụng hỗ trợ đúng với luồng test, ưu tiên rollback; không giả định rollback bao phủ connection, commit hoặc side effect ngoài database.
- Không che lỗi kết nối, lỗi truy vấn hoặc cleanup bằng catch rộng hay kết quả thành công giả. Báo rõ lỗi và trạng thái **Blocked**/**Fail** phù hợp.

## 3. Thiết kế kiểm thử

- Chỉ chuyển yêu cầu đã biết thành assertion. Với thông tin chưa xác nhận về schema, constraint, isolation, transaction hoặc dữ liệu mong đợi, đánh dấu **TBD** thay vì tự đặt contract.
- Chọn loại kiểm tra phù hợp với mục tiêu đã duyệt: kết nối/readiness, kết quả truy vấn, persistence sau thao tác, mapping dữ liệu, constraint/validation, transaction/rollback hoặc tính nhất quán giữa API/UI và database.
- Với từng test, xác định setup, dữ liệu đầu vào, truy vấn/điểm quan sát, assertion, cleanup và tác động phụ. Mỗi test cần độc lập, có thể lặp lại và kiểm tra đúng outcome thay vì chỉ xác nhận truy vấn không ném lỗi.
- Đối chiếu kết quả database với dữ liệu đầu vào hoặc contract được xác nhận. Kiểm tra những cột/trường có ý nghĩa; tránh phụ thuộc vào thứ tự kết quả nếu query không quy định thứ tự.
- Nếu yêu cầu chỉ là kiểm tra đọc, không thêm ghi dữ liệu “để tiện kiểm tra”. Nếu cần tạo fixture dữ liệu, liệt kê và xin duyệt phần ghi cùng cleanup trong test case.

## 4. Triển khai theo repository

1. Kiểm tra prior art trong `tests/database/`, `src/fixtures/db.fixtures.ts`, `src/Helper/utils/db/` và các module database liên quan. Tái sử dụng fixture, connection pool và helper hiện có; không tạo wrapper kết nối trùng lặp.
2. Đặt spec tại `tests/database/` hoặc thư mục tính năng đang có nếu cấu trúc phù hợp. Dùng Playwright Test và assertion `expect`; nhập fixture/helper theo pattern hiện hữu.
3. Factory hiện có khai báo driver `mssql`, `postgres`, `oracle`; fixture `db.fixtures.ts` hiện cung cấp `clmsDb` và `dnaDb`. Kiểm tra cấu hình/biến môi trường và quyền truy cập thực tế trước khi chọn driver hoặc fixture; không tự tạo tên cấu hình khác.
4. Một số test có thể cần pool PostgreSQL riêng, ví dụ test tích hợp với `src/Helper/Allure/`. Dùng đúng resource lifecycle hiện có và đóng connection/pool trong `finally` khi test sở hữu resource đó.
5. Với truy vấn qua `QueryStore`, dùng query key và file query hiện hữu nếu phù hợp. Với SQL viết trực tiếp, parameterize đầu vào và chọn cú pháp tương thích với driver đã xác định.
6. Giữ type dữ liệu có ý nghĩa, assertion rõ ràng và tên test mô tả hành vi. Không đưa dữ liệu trả về nhạy cảm vào thông báo assertion hoặc log.
7. Nếu thay đổi cấu trúc framework dùng chung (fixture, tầng truy cập DB, luồng chạy hoặc báo cáo), tạo/cập nhật tài liệu thiết kế trong `design-docs/` bằng tiếng Việt theo hướng dẫn repository. Không cần tài liệu thiết kế cho một spec riêng lẻ.

## 5. Chạy kiểm thử và báo cáo

- Chỉ kết nối/chạy test sau khi case được duyệt và môi trường, dữ liệu, quyền thao tác đã rõ.
- Chạy spec database hẹp nhất trước, ví dụ: `npx playwright test tests/database/<spec>.spec.ts`. Ưu tiên script sẵn có khi nó bao phủ đúng phạm vi; không chạy toàn suite nếu không cần.
- Dùng Allure đã cấu hình cho lần chạy Playwright Test, và báo chính xác lệnh, trạng thái, vị trí `allure-results/` hoặc `allure-report/` nếu báo cáo đã được tạo. Không nói báo cáo đã tạo nếu chưa chạy lệnh tạo.
- Ghi nhận từng test case là **Pass**, **Fail** hoặc **Blocked**. Nêu database/driver và môi trường ở mức an toàn, assertion thực tế, lỗi liên quan và giới hạn; không đưa bí mật hoặc dữ liệu nhạy cảm vào báo cáo.
- Nếu kết nối thất bại do cấu hình, quyền, mạng hoặc dịch vụ, báo **Blocked** với thông tin chẩn đoán đã được làm sạch. Không xem kết nối thành công hoặc query chạy xong là bằng chứng dữ liệu đúng.
- Nếu người dùng chỉ yêu cầu thiết kế case, trình bày bảng đề xuất và dừng; không sửa spec, mở kết nối hoặc chạy test.
