# TypeWords Vietnamese-First Localization & Database Migration

Tài liệu này xác định ranh giới (boundaries) và nguyên tắc kiến trúc cho fork tùy biến `Dyu20705/TypeWords`.

## 1. Ranh giới dự án (Fork Boundaries)
- **Fork sở hữu riêng**: Dự án này là bản phân phối tùy biến hướng tới người học tiếng Anh tại Việt Nam (`vi-first`), duy trì song song với phiên bản tiếng Anh quốc tế (`en`).
- **Không tạo Upstream PR/Issue**: Không gửi Pull Request hoặc mở Issue gây xung đột hay rác sang kho lưu trữ upstream của tác giả gốc (`zyronon/TypeWords`). Mọi liên kết mã nguồn và hỗ trợ trỏ trực tiếp về `https://github.com/Dyu20705/TypeWords`.
- **Học liệu tiếng Anh là đối tượng cốt lõi**: Giữ nguyên toàn bộ corpus học tập tiếng Anh (từ vựng, phiên âm IPA, audio phát âm, bài đọc).

## 2. Tiêu chuẩn giao diện & Ngôn ngữ (UI & Locales)
- Chỉ hỗ trợ chính thức 2 ngôn ngữ giao diện:
  1. `vi` (Tiếng Việt - Ngôn ngữ mặc định / Default locale).
  2. `en` (English - Ngôn ngữ thứ hai).
- Xóa bỏ toàn bộ 12 locale phụ không duy trì.
- `strategy: 'prefix_and_default'` trên `@nuxtjs/i18n`.
- Loại bỏ hoàn toàn sự rò rỉ của chuỗi ký tự tiếng Trung trên toàn bộ UI học tập, cài đặt và thống kê.
- Loại bỏ các thành phần đặc thù của hệ sinh thái nội địa Trung Quốc (WeChat, MiniProgram, QQ, Xiaohongshu, Baidu translate proxy, số giấy phép ICP).

## 3. Quy chuẩn cơ sở dữ liệu IndexedDB (Locale-Neutral Database Identity)
- **ID định danh bất biến (Stable Identifiers)**:
  - Danh mục hệ thống mặc định KHÔNG được dùng tên ngôn ngữ cụ thể (`'收藏'`, `'错词'`, `'已掌握'` hay `'Favorites'`, `'Wrong words'`) làm định danh bản ghi trong IndexedDB.
  - Định danh chuẩn là các hằng số độc lập với ngôn ngữ:
    - Sổ từ yêu thích: `wordCollect`
    - Sổ từ sai: `wordWrong`
    - Sổ từ đã thuộc: `wordKnown`
    - Sổ bài đọc yêu thích: `articleCollect`
- **Hiển thị nhãn (Display Labels)**:
  - Tên hiển thị của các sổ từ hệ thống phải được giải quyết động thông qua i18n (`$t('books.' + id)`) tại tầng hiển thị (Presentation Layer).
  - Bản ghi lưu trong IndexedDB có `name: ''` hoặc ID chuẩn, bảo đảm khi người dùng đổi ngôn ngữ từ `vi` sang `en`, tên sổ từ tự động chuyển đổi mà không cần cập nhật database.
- **Migration an toàn & Bất biến (Idempotent Migration)**:
  - Bộ chuyển đổi dữ liệu kế thừa (`normalizeLegacySystemBook`) tự động phát hiện các bản ghi cũ mang tên tiếng Trung hoặc tiếng Anh và quy đổi về ID chuẩn.
  - Bảo toàn toàn bộ dữ liệu tự tạo của người dùng: custom books, custom words, ghi chú (notes), trạng thái thuật toán lặp lại ngắt quãng FSRS, và lịch sử gõ từ.

## 4. Xử lý bộ gõ tiếng Việt (Vietnamese IME Support)
- Khắc phục sự cố bộ gõ Telex/VNI kích hoạt cảnh báo `请切换到英文输入` (Vui lòng chuyển sang gõ tiếng Anh).
- Cho phép người dùng gõ từ vựng tiếng Anh tự nhiên ngay cả khi đang bật Unikey, EVKey hoặc bộ gõ tiếng Việt của hệ điều hành mà không làm gián đoạn typing engine.
