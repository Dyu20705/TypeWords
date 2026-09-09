# TypeWords — Yêu Cầu Sản Phẩm (Product Requirements)

Tài liệu này xác định mục tiêu sản phẩm, đối tượng người dùng, triết lý thiết kế và các yêu cầu chức năng trọng tâm của **TypeWords (Bản Fork Việt Hóa)**.

---

## 1. Tuyên Ngôn Sản Phẩm (Product Vision)
**TypeWords** là ứng dụng luyện gõ phím kết hợp học từ vựng tiếng Anh mã nguồn mở hàng đầu, hoạt động theo mô hình **Local-First** (ưu tiên chạy mượt mà ngay cả khi ngắt mạng hoàn toàn), bảo vệ tuyệt đối dữ liệu cá nhân của người học và mang lại trải nghiệm bản địa hóa hoàn hảo cho người Việt Nam.

---

## 2. Đối Tượng Người Học Mục Tiêu (Target Audience)
1. **Thí sinh luyện thi chứng chỉ quốc tế**: IELTS, TOEFL, GRE, GMAT, SAT, TOEIC, PET, KET.
2. **Sinh viên & Học sinh phổ thông**: Người học New Concept English, SGK tiếng Anh các cấp độ phổ thông và đại học.
3. **Lập trình viên & Kỹ sư CNTT**: Người muốn luyện tốc độ gõ phím các thuật ngữ chuyên ngành công nghệ thông tin (`it-words.json`).
4. **Người tự học nâng cao phản xạ gõ phím 10 ngón**: Rèn luyện trí nhớ cơ bắp (muscle memory) thông qua âm thanh phím cơ sống động.

---

## 3. Triết Lý Thiết Kế Cốt Lõi (Core Principles)
* **Local-First & Không Gián Đoạn**: Toàn bộ 194 bộ từ điển tĩnh lưu trữ cục bộ, nạp tức thì; không phụ thuộc vào kết nối API bên thứ ba.
* **Hỗ Trợ Hoàn Hảo Bộ Gõ Tiếng Việt**: Không xung đột với các bộ gõ Unikey, EVKey, OpenKey; cho phép gõ từ tiếng Anh tự nhiên không bị chặn bởi IME composition.
* **Quyền Riêng Tư Tuyệt Đối**: Không chèn mã theo dõi, không quảng cáo, không thu thập nhật ký phím bấm lên máy chủ bên ngoài.
* **Khoa Học Ghi Nhớ FSRS**: Tích hợp thuật toán lặp lại ngắt quãng Free Spaced Repetition Scheduler v5 để tối ưu hóa chu kỳ ôn tập từ vựng cá nhân.
