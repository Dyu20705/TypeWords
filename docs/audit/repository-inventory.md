# TypeWords — Repository Inventory Baseline (Phase 0 Audit)

> **Thời điểm lập**: 2026-09-09  
> **Repository**: `Dyu20705/TypeWords`  
> **Nhánh**: `feat/vi-en-localization`  
> **Commit Snapshot**: `6aafa03a012333a070f0234fb6dce99347202931`  
> **Upstream Base**: `zyronon/TypeWords@master` (`633e179c1197c84325ad92fb983d3435dfe4b37a`)

---

## 1. Tổng Quan Cấu Trúc Mã Nguồn (Codebase Overview)

| Khu Vực | Đường Dẫn | Số Lượng Tệp | Vai Trò Chính |
| :--- | :--- | :--- | :--- |
| **Application Runtime** | `app/` | 148 tệp | Mã nguồn Nuxt 4, Vue 3, UnoCSS, Stores, Components |
| **Data Engineering** | `scripts/vocabulary/` | 17 tệp | Bộ kịch bản thu thập, chuẩn hóa, dịch thuật và kiểm tra từ điển |
| **CI / Quality Checks** | `scripts/` | 7 tệp | Script kiểm tra i18n, DB migration, scan hardcode tiếng Trung |
| **Runtime Static Assets** | `public/dicts/`, `public/list/` | 198 tệp JSON | 194 bộ từ điển tĩnh, 4 tập bài đọc NCE, 4 tệp catalog |
| **Internationalization** | `i18n/locales/` | 2 tệp JSON | `vi.json` (1.091 khóa) và `en.json` (1.091 khóa) |
| **Documentation** | `docs/` | 7 tệp MD | Tài liệu kỹ thuật, hướng dẫn vận hành, kiến trúc |

---

## 2. Phân Bổ Tầng Ứng Dụng (`app/`)

### 2.1 Thành Phần UI Primitives (`app/base/` - 32 tệp)
Các component cơ bản đóng vai trò Design System thu nhỏ của dự án:
* **Form & Input**: `BaseInput.vue`, `InputNumber.vue`, `Textarea.vue`, `Switch.vue`, `Slider.vue`
* **Nút bấm & Lựa chọn**: `BaseButton.vue`, `OptionButton.vue`, `BaseOptionButton.vue`, `UploadButton.vue`, `checkbox/`, `radio/`, `select/`
* **Điều hướng & Hiển thị**: `Pagination.vue`, `Progress.vue`, `Loading.vue`, `Tooltip.vue`, `Collapse.vue`, `Calendar.vue`
* **Hộp thoại & Thông báo**: `PopConfirm.vue`, `MiniDialog.vue`, `dialog/Dialog.vue`, `dialog/stack.ts`, `toast/Toast.ts`
* **Biểu tượng & Đa phương tiện**: `Audio.vue`, `BaseIcon.vue`, `icon/`

> **Chính sách**: Giữ nguyên vẹn 100% các component này, không đổi tên hoặc rewrite.

### 2.2 Thành Phần Tính Năng (`app/components/` - 45 tệp)
* `app/components/article/`: Quản lý bài đọc, giao diện gõ bài đọc (`TypingArticle.vue`)
* `app/components/word/`: Giao diện hiển thị từ, chi tiết từ, âm thanh
* `app/components/practice/`: Bàn phím ảo, khu vực luyện gõ, đồng hồ tính giờ
* `app/components/setting/`: Bảng cài đặt, cấu hình Supabase, nhật ký phím
* `app/components/dict/`: Thẻ từ điển, danh sách phân loại
* `app/components/import/`: Modal nhập liệu Excel / văn bản

### 2.3 Hệ Thống Trang & Điều Hướng (`app/pages/` - 12 tệp)
* `index.vue`: Trang chủ điều hướng trung tâm
* `setting.vue`: Bảng cài đặt toàn diện (giao diện, âm thanh, sao lưu)
* `about.vue`, `help.vue`, `feedback.vue`: Trang phụ trợ
* `(words)/words.vue`: Luồng luyện tập từ vựng chính
* `(words)/dict.vue`: Chi tiết một bộ từ điển và danh sách từ
* `(words)/dict-list.vue`: Bảng chọn từ điển theo danh mục
* `(articles)/articles.vue`: Luồng luyện tập bài đọc tiếng Anh

### 2.4 Nhân Nghiệp Vụ Cũ (`app/core/` - 25 tệp)
* `app/core/apis/`: `words.ts` (API tra từ ngoại vi)
* `app/core/config/`: `env.ts` (Cấu hình môi trường, CDN, phiên bản)
* `app/core/hooks/`: `sound.ts` (Web Audio API phát âm thanh phím cơ)
* `app/core/stores/`: `base.ts`, `setting.ts`, `practice.ts`, `runtime.ts` (Pinia stores)
* `app/core/types/`: `types.ts`, `enum.ts`, `func.ts` (TypeScript interfaces)
* `app/core/utils/`: `index.ts` (25KB), `migration.ts` (8.4KB), `cache.ts`, `http.ts`, `supabase.ts`, `word-test.ts`, `MessageBox.tsx`

> **Phát hiện Audit**: `app/core/utils/` đang đóng vai trò "junk drawer", gom lẫn logic di trú cơ sở dữ liệu, gọi API, xác thực mật khẩu, và các hàm tiện ích mảng/chuỗi.

---

## 3. Thống Kê Dữ Liệu Tĩnh (`public/`)

* **Tổng số bộ từ điển**: 194 tệp `.json` trong `public/dicts/en/word/`
* **Tổng dung lượng từ điển**: ~524 MB dữ liệu JSON
* **Tổng số từ vựng**: 277.529 từ
* **Số tập bài đọc**: 4 tập New Concept English (NCE 1-4) trong `public/dicts/en/article/` (~1 MB)
* **Tệp Catalog**:
  - `public/list/word.json`: Danh mục 194 từ điển (đã Việt hóa tên, danh mục, tags)
  - `public/list/article.json`: Danh mục 4 tập bài đọc
  - `public/list/recommend_word.json`: Danh sách từ điển gợi ý
  - `public/list/recommend_article.json`: Danh sách bài đọc gợi ý

---

## 4. Ngữ Liệu Đa Ngôn Ngữ (`i18n/`)

* **Locale mặc định**: `vi` (Tiếng Việt)
* **Locale phụ trợ**: `en` (Tiếng Anh)
* **Số lượng khóa**: 1.091 khóa đối xứng chính xác 100% giữa `vi.json` và `en.json`.
* **Trạng thái tiếng Trung**: Đạt 0 ký tự Trung Quốc trong `vi.json`.
* **Các locale đã loại bỏ từ upstream**: 12 locale phụ không duy trì (zh-CN, zh-TW, ja, ko, de, fr, es, ru, it, pt, id, th) đã được lược bỏ để tinh gọn bundle.

---

## 5. Kết Luận Kiểm Kê Baseline

1. Giao diện người dùng và hệ thống bàn gõ hiện hoạt động ổn định.
2. Cấu trúc thư mục hiện tại có sự phân tách sơ khởi nhưng ranh giới chưa nghiêm ngặt (data pipeline đặt lẫn trong `scripts/`, store Pinia gọi trực tiếp `idb-keyval`, utils chứa lẫn logic migration).
3. Đủ điều kiện và an toàn để triển khai tái cấu trúc theo mô hình Modular Monolith mà không gây gián đoạn UI.
