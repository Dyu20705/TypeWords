# TypeWords — Dependency & Security Audit (Phase 0 Audit)

> **Thời điểm lập**: 2026-09-09  
> **Repository**: `Dyu20705/TypeWords`  
> **Phạm vi kiểm toán**: `package.json` (50 dependencies, 57 devDependencies) và Static Import Graph

---

## 1. Bảng Kiểm Toán Phụ Thuộc Cốt Lõi (Critical Dependencies)

| Gói Phụ Thuộc | Phiên Bản | Vị Trí Nhúng Trong Mã Nguồn | Lý Do Tồn Tại & Vai Trò | Mức Độ Rủi Ro | Quyết Định / Khuyến Nghị |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`compromise`** | `^14.14.4` | `app/components/article/TypingArticle.vue` | Phân tích cú pháp câu (NLP tokenization & POS tagging) trong luồng gõ bài đọc | Thấp | **GIỮ NGUYÊN**: Đang phục vụ trực tiếp tính năng gõ bài đọc |
| **`axios`** | `1.15.0` | `app/core/utils/http.ts` | Gửi HTTP requests tra cứu từ điển | Thấp | **THAY THẾ (Phase 5)**: Nuxt 4 đã có sẵn `$fetch` / `ofetch`, thay thế giúp giảm ~30KB bundle |
| **`node-forge`** | `^1.3.1` | `app/core/utils/rsa-password.ts` | Mã hóa RSA mật khẩu người dùng với API máy chủ upstream | Trung bình | **CÔ LẬP**: Đóng gói trong auth infrastructure; đánh giá lược bỏ nếu chạy thuần local |
| **`@rrweb/record`**<br>`rrweb-player` | `2.0.0-alpha.20`<br>`2.0.0-alpha.20` | `app/app.vue` (route `/rrweb`) | Ghi lại và phát lại phiên gõ phím phục vụ debug | Trung bình (Alpha) | **LAZY-LOAD**: Tách khỏi main chunk; đánh giá loại bỏ nếu không dùng cho người dùng cuối |
| **`xlsx`** | `^0.18.5` | `app/pages/(words)/dict.vue`, `app/components/BaseTable.vue` | Nhập và xuất danh sách từ vựng cá nhân ra tệp Excel `.xlsx` | Thấp | **GIỮ NGUYÊN**: Tính năng import/export người dùng quan trọng |
| **`@supabase/supabase-js`** | `^2.98.0` | `app/core/utils/supabase.ts`, `app/pages/setting.vue` | Sao lưu đám mây cá nhân hóa (người dùng tự điền URL & Key của họ) | Thấp | **GIỮ NGUYÊN**: Tính năng đồng bộ cloud tùy chọn không lưu máy chủ trung gian |
| **`@vueuse/core`** | `^14.0.0-alpha.0` | Dùng phổ biến trong các composable và component | Tiện ích reactive Vue 3 (local storage, event listener, hotkeys) | Cao (Alpha) | **ỔN ĐỊNH HÓA (Phase 5)**: Khóa về phiên bản stable đã kiểm định tương thích |
| **`vue-virtual-scroller`** | `2.0.0-beta.8` | `app/pages/(words)/dict.vue` | Cuộn ảo danh sách từ điển lớn (>10.000 từ như CET-8, IELTS) | Thấp | **GIỮ NGUYÊN**: Đảm bảo 60 FPS khi duyệt danh sách từ cực lớn |
| **`ts-fsrs`** | `^5.2.3` | `app/core/stores/base.ts` | Thuật toán lặp lại ngắt quãng Free Spaced Repetition Scheduler v5 | Thấp | **GIỮ NGUYÊN**: Đưa vào domain service trong Phase 3 |
| **`idb-keyval`** | `^6.2.2` | `app/core/stores/base.ts`, `app/core/utils/migration.ts` | Wrapper IndexedDB siêu nhẹ (600 bytes) lưu trữ tiến độ học | Thấp | **GIỮ NGUYÊN**: Trừu tượng hóa sau Repository Pattern trong Phase 3 |

---

## 2. Kiểm Toán Gói Phát Triển (devDependencies Audit)

* **Icon Bundles**: 19 gói `@iconify-json/*` (tdesign, bx, clarity, fluent, mdi, ph, ri, simple-icons...).
  - *Đánh giá*: UnoCSS tự động purge icon không dùng khi đóng gói production qua `@unocss/preset-icons`, không ảnh hưởng tới dung lượng bundle người dùng.
* **Build Engine**: `nuxt` 4.2.1, `vite` 7.0.3, `unocss` 66.5.10, `typescript` 5.9.3.
  - *Đánh giá*: Hiện đại, hỗ trợ native ESM và TypeScript compilation cực nhanh.

---

## 3. Lộ Trình Tối Ưu Phụ Thuộc (Dependency Remediation Roadmap)

1. **Phase 3**: Đóng gói `ts-fsrs` vào `app/core/learning/fsrs/` và `idb-keyval` vào `app/core/persistence/indexeddb/`.
2. **Phase 5**:
   - Refactor `app/core/utils/http.ts` sang `$fetch` native của Nuxt $\to$ Gỡ bỏ gói `axios`.
   - Kiểm định và hạ `@vueuse/core` từ bản alpha về phiên bản ổn định (stable tag).
   - Kiểm tra tree-shaking của `xlsx` và đảm bảo thư viện không bị tải vào bundle khởi động ban đầu.
