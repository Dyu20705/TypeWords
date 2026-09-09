# TypeWords (Phiên Bản Việt Hóa)

> **Ứng dụng luyện gõ phím kết hợp học từ vựng tiếng Anh thông minh — Hoạt động Local-First, hoàn toàn ngoại tuyến và bảo vệ quyền riêng tư.**

[![Nuxt 4](https://img.shields.io/badge/Nuxt-4.2-00DC82?logo=nuxt.js)](https://nuxt.com/)
[![Vue 3](https://img.shields.io/badge/Vue-3.5-4FC08D?logo=vuedotjs)](https://vuejs.org/)
[![UnoCSS](https://img.shields.io/badge/UnoCSS-Atomic-black?logo=unocss)](https://unocss.dev/)
[![IndexedDB](https://img.shields.io/badge/IndexedDB-Local--First-blue)](https://github.com/jakearchibald/idb-keyval)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 30 Giây Nắm Bắt TypeWords

* 🚀 **Kho từ vựng khổng lồ**: 194 bộ từ điển tĩnh tích hợp sẵn (**277.529 từ vựng**) bao phủ toàn diện: IELTS, TOEFL, GRE, GMAT, SAT, New Concept English 1-4, Tiếng Anh CNTT...
* 🇻🇳 **Bản địa hóa hoàn hảo**: Giao diện Tiếng Việt 100%, bản dịch nghĩa tiếng Việt chuẩn ngữ cảnh, bảo tồn trọn vẹn từ gốc và câu ví dụ tiếng Anh.
* ⌨️ **Hỗ trợ tối ưu Bộ gõ tiếng Việt**: Gõ tiếng Anh tự nhiên, mượt mà, không bị gián đoạn hay kẹt phím bởi Unikey, EVKey hay OpenKey.
* 🧠 **Khoa học ghi nhớ FSRS**: Thuật toán lặp lại ngắt quãng Free Spaced Repetition Scheduler v5 tính toán chính xác chu kỳ ôn tập giúp ghi nhớ từ vựng vĩnh viễn.
* 🎧 **Âm thanh phím cơ sống động**: Tích hợp hiệu ứng âm thanh phím cơ chân thực (Cherry MX Blue, Red, Brown, Máy đánh chữ cổ điển...) cùng giọng phát âm chuẩn bản ngữ US/UK.
* 🔒 **Local-First & Bảo mật**: Dữ liệu lưu hoàn toàn trên máy của bạn (IndexedDB); không chèn mã theo dõi, không quảng cáo.

---

## Bắt Đầu Nhanh (Quick Start)

```bash
# 1. Clone mã nguồn:
git clone https://github.com/Dyu20705/TypeWords.git
cd TypeWords

# 2. Cài đặt các gói phụ thuộc:
pnpm install

# 3. Khởi chạy máy chủ phát triển cục bộ:
pnpm dev
```
Truy cập ngay trên trình duyệt: **`http://localhost:5567`**

---

## Hệ Thống Tài Liệu Kỹ Thuật (Documentation)

| Lĩnh Vực | Tài Liệu Chi Tiết | Mô Tả |
| :--- | :--- | :--- |
| **Sản Phẩm** | [Yêu Cầu Sản Phẩm](docs/product/requirements.md) • [Lộ Trình](docs/product/roadmap.md) | Mục tiêu sản phẩm, đối tượng học và kế hoạch phát triển |
| **Kiến Trúc** | [Tổng Quan Kiến Trúc](docs/architecture/overview.md) • [Mô Hình Dữ Liệu](docs/architecture/data-model.md) • [Ranh Giới Upstream](docs/architecture/upstream-boundary.md) • [ADR-001](docs/architecture/adr/ADR-001-modular-monolith-data-pipeline.md) • [ADR-002](docs/architecture/adr/ADR-002-transitional-legacy-adapter.md) | Sơ đồ Modular Monolith, ranh giới fork và quyết định kỹ thuật |
| **Phát Triển** | [Cài Đặt](docs/development/setup.md) • [Kiểm Thử](docs/development/testing.md) • [Gỡ Lỗi](docs/development/debugging.md) | Hướng dẫn môi trường, kịch bản test và xử lý sự cố |
| **Kỹ Nghệ Dữ Liệu** | [Data Pipeline](docs/data/vocabulary-pipeline.md) • [Chính Sách Dịch Thuật](docs/data/translation-policy.md) • [Quality Gates](docs/data/quality-gates.md) | Quy trình `pnpm data:*`, bảng thuật ngữ và 3 tầng cổng chất lượng |
| **Kiểm Toán Baseline**| [Repository Inventory](docs/audit/repository-inventory.md) • [Dependency Audit](docs/audit/dependency-audit.md) • [Data Inventory](docs/audit/data-inventory.md) • [Test Baseline](docs/audit/test-baseline.md) • [Architecture Baseline](docs/audit/architecture-baseline.md) | Báo cáo kiểm kê kỹ thuật ban đầu (Phase 0 Audit) |
| **Tra Cứu Nhanh** | [Phím Tắt & Cẩm Nang](docs/reference/cheatsheet.md) | Bảng phím tắt luyện gõ và lệnh tra cứu nhanh |

---

## Giấy Phép & Nguồn Gốc (License & Attribution)

* Giấy phép mã nguồn mở: **MIT License** — xem tệp [LICENSE](LICENSE).
* Kho lưu trữ gốc upstream: [`zyronon/TypeWords`](https://github.com/zyronon/TypeWords).
* Bản fork Việt hóa duy trì bởi: [`Dyu20705/TypeWords`](https://github.com/Dyu20705/TypeWords).
