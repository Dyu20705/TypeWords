# Type Words — Hướng Dẫn Phát Triển (Development Guide)

Tài liệu này cung cấp hướng dẫn toàn diện dành cho các lập trình viên muốn tham gia phát triển, tùy biến hoặc đóng góp mã nguồn cho **Type Words**.

---

## 1. Yêu Cầu Môi Trường (Prerequisites)

* **Node.js**: Phiên bản 18.18+ hoặc 20.x trở lên ([Tải tại nodejs.org](https://nodejs.org/)).
* **Trình quản lý gói**: `pnpm` phiên bản 8.x hoặc 9.x (Khuyến nghị cài đặt qua `npm install -g pnpm`).
* **Hệ điều hành**: Linux, macOS, hoặc Windows (hỗ trợ tốt trên WSL2 hoặc PowerShell).
* **Trình duyệt khuyến nghị**: Google Chrome hoặc Chromium để hỗ trợ đầy đủ nhất các API `IndexedDB` và `Web Audio`.

---

## 2. Thiết Lập & Chạy Ứng Dụng (Setup & Running)

### 2.1 Clone mã nguồn dự án
Do kho lưu trữ chứa toàn bộ dữ liệu 194 bộ từ điển cục bộ, khuyến nghị sử dụng cờ `--depth 1` để giảm bớt dung lượng lịch sử git:
```bash
git clone --depth 1 https://github.com/Dyu20705/TypeWords.git
cd TypeWords
```

### 2.2 Cài đặt các gói phụ thuộc (Dependencies)
```bash
pnpm install
```

### 2.3 Khởi chạy máy chủ phát triển cục bộ (Development Server)
```bash
pnpm dev
```
Mở trình duyệt truy cập: [`http://localhost:5567`](http://localhost:5567)  
*Lưu ý: Cổng mặc định của dự án được chỉ định tại `5567` trong tệp cấu hình `nuxt.config.ts`.*

### 2.4 Đóng gói sản phẩm (Production Build)
```bash
# Đóng gói ứng dụng SSR / Node server:
pnpm build

# Đóng gói tĩnh hoàn toàn (Static Site Generation - SSG):
pnpm generate
# Các tệp tĩnh đầu ra sẽ nằm tại thư mục: .output/public/
```

---

## 3. Bộ Công Cụ Kiểm Thử Tự Động (Automated Test Suite)

Dự án thiết lập quy trình kiểm thử nghiêm ngặt trước khi hợp nhất mã nguồn. Để chạy toàn bộ các bài test, sử dụng lệnh:
```bash
pnpm test
```

Lệnh trên sẽ tự động thực thi 3 kịch bản kiểm định độc lập:

### 3.1 Kiểm định ngôn ngữ đa phương tiện (`scripts/lint-i18n.ts`)
* Kiểm tra tính đối xứng 100% về số lượng và cấu trúc khóa (1.091 khóa) giữa `i18n/locales/vi.json` và `i18n/locales/en.json`.
* Đảm bảo không có khóa nào bị thiếu hoặc bỏ trống.
* Quét tự động bằng biểu thức chính quy Regex `[\u4e00-\u9fa5]` để bảo đảm **0 ký tự tiếng Trung** tồn tại trong tệp bản địa hóa tiếng Việt.

### 3.2 Kiểm định di trú cơ sở dữ liệu (`scripts/test-db-migration.ts`)
* Chạy 7 bài test đơn vị độc lập đối với tầng dữ liệu `app/core/service/db.ts`:
  1. Phân giải động tên sổ từ tại tầng hiển thị (`getBookName`).
  2. Chuẩn hóa bản ghi legacy tiếng Trung sang ID bất biến (`wordCollect`, `wordWrong`...).
  3. Chuẩn hóa bản ghi legacy tiếng Anh sang ID bất biến.
  4. Bảo toàn nguyên vẹn các sổ từ và từ vựng tự tạo của người dùng (`custom books`).
  5. Bảo đảm tính sẵn sàng của các sổ từ hệ thống khi khởi tạo.
  6. Bảo toàn dữ liệu ghi chú (`notes`) và trạng thái thuật toán lặp lại ngắt quãng FSRS.
  7. Kiểm tra tính bất biến (Idempotency) khi chạy hàm di trú nhiều lần liên tiếp.

### 3.3 Quét chuỗi tiếng Trung cứng (`scripts/check-hardcoded-zh.ts`)
* Quét toàn bộ hơn 200 tệp mã nguồn (`.vue`, `.ts`, `.js`, `.json`) trong thư mục `app/` để phát hiện và ngăn chặn mọi chuỗi ký tự tiếng Trung hardcode chưa được chuyển ngữ sang i18n.

### 3.4 Kiểm định tính toàn vẹn kho từ vựng (`pnpm vocab:verify`)
* Kiểm tra cấu trúc mảng và tính hợp lệ của toàn bộ 194 bộ từ điển trong `public/dicts/en/word/`.
* Xác nhận 970/970 bài test kiểm tra trường dữ liệu bắt buộc (`word`, `trans`, `phonetic`, `sentences`) đều đạt 100%.
* Xuất báo cáo đối chuẩn trực quan tại `scripts/vocabulary/benchmark-report.md`.

---

## 4. Quy Chuẩn Lập Trình (Coding Standards)

1. **Cú pháp Vue 3**:
   - Bắt buộc sử dụng `<script setup lang="ts">`.
   - Ưu tiên Composition API và các hooks chuẩn của Vue 3 (`ref`, `computed`, `watch`, `onMounted`).
2. **Quốc tế hóa (i18n)**:
   - Tuyệt đối **không hardcode** bất kỳ chuỗi văn bản giao diện nào bằng tiếng Việt, tiếng Anh hay tiếng Trung.
   - Luôn sử dụng hàm `$t('key.path')` trong template hoặc `const { t } = useI18n()` trong script.
   - Khi thêm chuỗi mới, phải bổ sung đồng thời vào cả hai tệp: `i18n/locales/vi.json` và `i18n/locales/en.json`.
3. **Quy chuẩn dữ liệu từ vựng**:
   - Giữ nguyên 100% từ tiếng Anh gốc (`c`), phiên âm IPA và audio phát âm.
   - Khi cập nhật nghĩa dịch tiếng Việt (`cn`), phải luôn lưu vết dữ liệu gốc sang trường `cn_source` để phục vụ đối chiếu và truy xuất nguồn gốc.
4. **Phong cách giao diện**:
   - Sử dụng các lớp tiện ích của **UnoCSS** theo quy tắc viết tắt trực quan.
   - Tránh viết CSS cục bộ quá dài dòng; ưu tiên tái sử dụng các biến giao diện màu sắc trong bảng theme (`dark` / `light`).

---

## 5. Ranh Giới Fork & Quản Trị Git (Git Hygiene)

* **Ranh giới fork sở hữu riêng**: Dự án này phục vụ cộng đồng người học tiếng Anh tại Việt Nam. Không tạo Pull Request hoặc gửi Issue gây rác sang kho lưu trữ upstream của tác giả gốc (`zyronon/TypeWords`).
* **Đóng góp và báo lỗi**: Mọi commit, tạo nhánh tính năng và báo cáo sự cố vui lòng thực hiện trực tiếp tại:
  **[https://github.com/Dyu20705/TypeWords](https://github.com/Dyu20705/TypeWords)**
