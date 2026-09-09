# TypeWords — Lộ Trình Phát Triển Sản Phẩm (Product Roadmap)

Lộ trình phát triển sản phẩm của bản fork `Dyu20705/TypeWords` tập trung vào củng cố chất lượng bản địa hóa, nâng cao độ tin cậy và trải nghiệm học tập:

---

## Giai Đoạn 1: Chuẩn Hóa Nền Tảng & Ranh Giới (Hoàn Tất)
- [x] Bản địa hóa 100% giao diện sang Tiếng Việt (`i18n/locales/vi.json` với 1.091 khóa đối xứng).
- [x] Gỡ bỏ hoàn toàn cảnh báo gây ức chế của bộ gõ IME tiếng Việt (Unikey/EVKey).
- [x] Chuẩn hóa định danh IndexedDB bất biến (`wordCollect`, `wordWrong`, `wordKnown`).
- [x] Di trú an toàn cơ sở dữ liệu legacy từ upstream.
- [x] Khôi phục và bản địa hóa trọn vẹn 194 bộ từ điển tĩnh và 4 tập bài đọc NCE.
- [x] Loại bỏ dịch vụ theo dõi ngoại vi (Baidu Analytics, libs.typewords.cc).

---

## Giai Đoạn 2: Tái Cấu Trúc Kiến Trúc & Kỹ Nghệ Dữ Liệu (Hiện Tại)
- [x] Xác lập quy chuẩn ranh giới với Upstream (`docs/architecture/upstream-boundary.md`).
- [x] Thiết lập bộ tài liệu kỹ thuật chuyên biệt theo domain (`docs/product/`, `docs/architecture/`, `docs/development/`, `docs/data/`).
- [ ] Tách rời Pipeline dữ liệu ra khỏi runtime app (`pnpm data:*`).
- [ ] Triển khai 3 tầng Quality Gates (Structural, Linguistic, Build) cho toàn bộ dataset từ vựng.
- [ ] Xây dựng hệ thống Translation Memory & Glossary để chuẩn hóa dịch thuật theo ngữ cảnh.
- [ ] Triển khai Repository Pattern và Versioned Database Migrations.

---

## Giai Đoạn 3: Trải Nghiệm Nâng Cao & Xuất Bản (Tương Lai)
- [ ] Hỗ trợ phát âm AI chất lượng cao ngoại tuyến (Web Speech API / Offline TTS).
- [ ] Bổ sung chế độ luyện gõ câu ví dụ thông minh (Sentence Typing Mode).
- [ ] Tích hợp tính năng đồng bộ cá nhân hóa không chạm qua WebDAV / Self-hosted Supabase.
- [ ] Đóng gói phiên bản ứng dụng máy tính (Desktop App qua Tauri) tối ưu hóa tài nguyên.
