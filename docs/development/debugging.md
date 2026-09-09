# TypeWords — Hướng Dẫn Gỡ Lỗi (Debugging Guide)

Tài liệu này tổng hợp các kỹ thuật gỡ lỗi phổ biến và cách khắc phục các vấn đề thường gặp trong quá trình phát triển **TypeWords**.

---

## 1. Gỡ Lỗi Cơ Sở Dữ Liệu IndexedDB Cục Bộ

1. Mở trình duyệt Chrome / Chromium $\to$ Nhấn `F12` mở DevTools.
2. Chuyển sang tab **Application** $\to$ Chọn mục **Storage** $\to$ **IndexedDB** $\to$ `keyval-store`.
3. Kiểm tra khóa `save_dict`:
   - `word.bookList`: Danh sách sổ từ và tiến độ học tập.
   - `fsrsData`: Trạng thái các thẻ FSRS theo từ vựng (`Record<string, Card>`).
   - `noteData`: Toàn bộ ghi chú từ vựng cá nhân.
4. Để xóa sạch cơ sở dữ liệu làm lại từ đầu: Chọn `Clear site data` hoặc chạy lệnh trong Console:
   ```javascript
   indexedDB.deleteDatabase('keyval-store')
   ```

---

## 2. Gỡ Lỗi Sự Kiện Bàn Phím & Bộ Gõ IME (Unikey / EVKey)

* Hệ thống lắng nghe sự kiện `keydown` toàn cục tại cửa sổ học tập.
* Nếu con trỏ bị nhảy bất thường khi dùng bộ gõ tiếng Việt Telex/VNI:
  - Mở file `app/pages/(words)/words.vue`.
  - Kiểm tra hàm `handleKeydown`: Chỉ các phím ký tự ASCII hợp lệ mới được tiếp nhận.
  - Bộ gõ tiếng Việt sẽ gửi chuỗi phím xóa lùi ảo (virtual backspaces) khi ghép dấu; hệ thống TypeWords bỏ qua các phím điều khiển ảo này để không làm hỏng chuỗi gõ tiếng Anh.

---

## 3. Gỡ Lỗi Âm Thanh Web Audio (Phím Cơ / Phát Âm)

* Âm thanh phát âm từ vựng được nạp qua Youdao Voice API:
  - US Voice: `https://dict.youdao.com/dictvoice?audio={word}&type=2`
  - UK Voice: `https://dict.youdao.com/dictvoice?audio={word}&type=1`
* Nếu không nghe thấy âm thanh:
  - Kiểm tra chính sách Autoplay của trình duyệt: Người dùng phải click ít nhất một lần vào trang để cấp quyền phát âm thanh (Web Audio API Policy).
  - Kiểm tra cài đặt volume trong bảng `Cài đặt` $\to$ `Âm thanh`.
