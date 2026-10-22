---
name: playwright-testcase-design
description: "Chỉ dùng để thiết kế, soạn hoặc rà soát test case UI/API bằng Playwright. Không triển khai spec, truy cập website, gửi API request hay chạy kiểm thử."
argument-hint: "Tính năng, URL, API endpoint, yêu cầu hoặc kịch bản cần kiểm thử"
---

# Thiết kế test case cho Playwright

Skill này chỉ tạo đề xuất test case để người dùng xem xét trong hội thoại. Không triển khai hoặc thực thi kiểm thử.

## 1. Phạm vi công việc

Có thể:

- Soạn test case UI và/hoặc API rõ ràng, độc lập dựa trên yêu cầu, URL, request cURL/Postman hoặc ngữ cảnh repository đã có.
- Nêu rõ giả định, điều kiện trước, dữ liệu, kết quả mong đợi và tác động phụ để người dùng duyệt.

Không được:

- Tạo hoặc sửa test spec, page object, API helper, fixture, tệp dữ liệu kiểm thử hay tệp dự án khác.
- Mở hoặc thao tác trình duyệt, dùng Playwright MCP, gửi HTTP/API request hoặc chạy lệnh test/build.
- Xem việc gọi skill hoặc duyệt đề xuất là sự cho phép chạy kiểm thử. Việc triển khai hay thực thi cần yêu cầu riêng và quy trình xác nhận phù hợp.

## 2. Thu thập thông tin và xử lý điểm chưa rõ

1. Xác định tính năng, loại kiểm thử (UI/API), endpoint hoặc trang nếu được cung cấp, môi trường nếu đã biết và hành vi mong đợi.
2. Chỉ sử dụng thông tin người dùng cung cấp hoặc ngữ cảnh repository hiện có. Không truy cập hệ thống thật để tìm phần còn thiếu.
3. Nếu có quyết định quan trọng chưa rõ, nêu phương án thực tế, đề xuất khi hữu ích và hỏi một câu hỏi cụ thể trước khi hoàn thiện đề xuất.
4. Nếu chưa biết điều kiện trước, contract response, status code, dọn dẹp dữ liệu hoặc môi trường, đánh dấu **TBD**; không tự đặt giả định thành sự thật.

## 3. Xây dựng test case

- Mỗi test case tập trung vào một mục tiêu và có điều kiện đạt có thể quan sát.
- Chỉ thêm trường hợp thành công, lỗi, kiểm tra dữ liệu, biên, trùng lặp hoặc idempotency khi có căn cứ từ yêu cầu và an toàn để đề xuất.
- Nêu dependency giữa các test case và mọi tác động phụ một cách tường minh.
- Tránh test case trùng nhau, giả định không có căn cứ hoặc selector gắn với cách triển khai nội bộ.
- Với UI, mô tả trạng thái bắt đầu, tương tác của người dùng và kết quả quan sát được.
- Với API, khi biết thì nêu method, endpoint, request header, dạng payload, status mong đợi và các trường response chính. Che thông tin bí mật và dữ liệu cá nhân.

## 4. Trình bày và dừng

Trình bày đề xuất theo bảng sau:

| ID | Loại | Kịch bản / mục tiêu | Điều kiện trước và dữ liệu | Các bước | Kết quả mong đợi | Môi trường / tác động phụ |
|---|---|---|---|---|---|---|
| TC-01 | UI / API | Một hành vi cần xác minh | Thiết lập và dữ liệu; che thông tin bí mật | Các thao tác ngắn gọn theo thứ tự | Trạng thái UI hoặc response contract quan sát được | Local / test / staging / production / TBD; ghi rõ thao tác ghi dữ liệu |

- Chỉ hỏi người dùng chọn phương án khi thiếu thông tin thiết yếu; ưu tiên lựa chọn rõ ràng thay vì tự suy đoán.
- Kết thúc bằng việc nói rõ rằng chỉ thiết kế test case đã được thực hiện: không truy cập website/API, không triển khai test và không chạy kiểm thử.
- Sau đó dừng.
