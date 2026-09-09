# TypeWords — Thiết Lập Môi Trường Phát Triển (Setup Guide)

Tài liệu này hướng dẫn cách thiết lập môi trường phát triển cục bộ cho dự án **TypeWords**.

---

## 1. Yêu Cầu Môi Trường (Prerequisites)

* **Node.js**: Phiên bản 18.18+ hoặc 20.x, 22.x LTS ([Tải tại nodejs.org](https://nodejs.org/)).
* **Trình quản lý gói**: `pnpm` phiên bản 8.x hoặc 9.x (Khuyến nghị: `npm install -g pnpm`).
* **Hệ điều hành**: Linux, macOS, hoặc Windows (hỗ trợ hoàn hảo qua WSL2 hoặc PowerShell).
* **Trình duyệt**: Google Chrome hoặc Chromium (để hỗ trợ tốt nhất Web Audio và IndexedDB API).

---

## 2. Các Bước Khởi Chạy (Step-by-Step)

### 2.1 Clone mã nguồn
```bash
git clone https://github.com/Dyu20705/TypeWords.git
cd TypeWords
git checkout feat/vi-en-localization
```

### 2.2 Cài đặt dependencies
```bash
pnpm install
```

### 2.3 Chạy Development Server
```bash
pnpm dev
```
Mở trình duyệt truy cập: [`http://localhost:5567`](http://localhost:5567)  
*(Cổng mặc định của dự án được cấu hình cố định tại `5567` trong `nuxt.config.ts`)*.

---

## 3. Đóng Gói Ứng Dụng (Production Build)

```bash
# Đóng gói Node / Nitro server:
pnpm build

# Đóng gói tĩnh hoàn toàn (Static Site Generation - SSG):
pnpm generate
# Tệp tĩnh đầu ra sẽ nằm tại: .output/public/
```
