# Type Words — Hướng Dẫn Vận Hành & Pipeline (Operations Guide)

Tài liệu này cung cấp quy trình vận hành chi tiết về đường ống dữ liệu từ vựng (Vocabulary Pipeline), đóng gói triển khai (Deployment), tối ưu hóa lưu trữ và cơ chế đồng bộ dữ liệu.

---

## 1. Đường Ống Dữ Liệu Từ Vựng (Vocabulary Pipeline)

Dự án trang bị một hệ sinh thái kịch bản tự động hóa hoàn chỉnh tại `scripts/vocabulary/` để quản lý, cập nhật và chuyển ngữ toàn bộ 194 bộ từ điển (277.529 từ).

```
┌────────────────────────────────────────────────────────────────────────┐
│                        VOCABULARY PIPELINE FLOW                        │
│                                                                        │
│   [ 1. vocab:discover ] ───► Quét & phân tích catalog gốc             │
│            │                                                           │
│            ▼                                                           │
│   [ 2. vocab:fetch ]    ───► Tải 194 bộ từ điển về public/dicts/       │
│            │                                                           │
│            ▼                                                           │
│   [ 3. vocab:validate ] ───► Kiểm định cú pháp & schema dữ liệu        │
│            │                                                           │
│            ▼                                                           │
│   [ 4. vocab:localize ] ───► Tạo catalog tiếng Việt public/list/       │
│            │                                                           │
│            ▼                                                           │
│   [ 5. vocab:translate] ───► Dịch tự động Trung -> Việt (đa luồng)    │
│            │                                                           │
│            ▼                                                           │
│   [ 6. vocab:verify ]   ───► Đối chuẩn benchmark & kiểm định 100%      │
└────────────────────────────────────────────────────────────────────────┘
```

### 1.1 Khám phá danh mục (`pnpm vocab:discover`)
* **Lệnh thực thi**:
  ```bash
  pnpm vocab:discover
  ```
* **Chức năng**: Quét danh mục từ điển gốc từ nguồn tài nguyên production (`https://files.typewords.cc/list/word.json`), phân loại theo chuyên mục và xuất bảng dữ liệu máy đọc `scripts/vocabulary/inventory.json`.

### 1.2 Tải và lưu trữ cục bộ (`pnpm vocab:fetch`)
* **Lệnh thực thi**:
  ```bash
  pnpm vocab:fetch
  ```
* **Chức năng**:
  - Tải toàn bộ 194 tệp từ điển JSON về thư mục cục bộ `public/dicts/en/word/`.
  - Tải trọn bộ 4 tập giáo trình New Concept English về `public/dicts/en/article/`.
  - Hỗ trợ tải song song (concurrency = 8), tự động thử lại khi mất mạng (exponential backoff) và bỏ qua các tệp đã tải hợp lệ.

### 1.3 Kiểm định tính toàn vẹn cú pháp (`pnpm vocab:validate`)
* **Lệnh thực thi**:
  ```bash
  pnpm vocab:validate
  ```
* **Chức năng**: Kiểm tra tính toàn vẹn của từng tệp JSON trên đĩa: định dạng mảng (Array), kích thước > 0, không rỗng và kiểm tra ngẫu nhiên các trường bắt buộc của từ vựng.

### 1.4 Bản địa hóa danh mục từ điển (`pnpm vocab:localize`)
* **Lệnh thực thi**:
  ```bash
  pnpm vocab:localize
  ```
* **Chức năng**:
  - Chuyển ngữ toàn bộ tiêu đề, mô tả ngắn, danh mục cha và các nhãn thẻ (tags) của 194 bộ từ điển sang tiếng Việt tự nhiên.
  - Cập nhật tự động tệp danh mục chính `public/list/word.json` và danh mục khuyến nghị `public/list/recommend_word.json`.
  - Cập nhật danh mục bài đọc New Concept English tại `public/list/article.json` và `recommend_article.json`.

### 1.5 Dịch thuật ngữ nghĩa song ngữ (`pnpm vocab:translate`)
* **Lệnh thực thi**:
  ```bash
  # Dịch một bộ từ điển cụ thể:
  pnpm vocab:translate --file <tên_tệp.json>

  # Ví dụ dịch bộ từ vựng Lập trình viên:
  pnpm vocab:translate --file it-words.json

  # Dịch các bộ từ vựng cốt lõi ưu tiên:
  pnpm vocab:translate --priority

  # Dịch toàn bộ các bộ từ điển trong kho:
  pnpm vocab:translate --all
  ```
* **Đặc tính kỹ thuật**:
  - Xử lý đa luồng (4 workers song song), gom cụm 70 dòng/lượt dịch.
  - Sử dụng bộ nhớ đệm đĩa cứng liên tục (`scripts/vocabulary/.translation-cache.json`) chứa hơn 116.000 cặp dịch đối sánh, giúp tái sử dụng kết quả dịch và tăng tốc độ cấp số nhân.
  - Ghi vết tệp theo từng chặng (`.checkpoints/`), cho phép dừng và tiếp tục dịch bất kỳ lúc nào mà không sợ mất dữ liệu.
  - **Quy tắc bất biến**: Luôn lưu nghĩa tiếng Trung gốc vào trường `cn_source` trước khi ghi đè trường `cn` bằng tiếng Việt.

### 1.6 Kiểm định và xuất báo cáo đối chuẩn (`pnpm vocab:verify`)
* **Lệnh thực thi**:
  ```bash
  pnpm vocab:verify
  ```
* **Chức năng**: Quét 100% dữ liệu trên đĩa, đối chiếu số lượng bản ghi thực tế với danh mục catalog và tạo báo cáo chi tiết tại `scripts/vocabulary/benchmark-report.md`.

---

## 2. Đóng Gói & Triển Khai (Build & Deployment)

### 2.1 Triển khai Tĩnh (Static Site Generation - Khuyến nghị)
Type Words hoàn toàn có thể chạy dưới dạng website tĩnh độc lập không cần backend:

1. **Sinh mã nguồn tĩnh**:
   ```bash
   pnpm generate
   ```
2. **Thư mục đầu ra**: Toàn bộ trang web và 194 tệp từ điển tĩnh sẽ được xuất tại thư mục:
   ```
   .output/public/
   ```
3. **Triển khai máy chủ**:
   - Bạn có thể tải toàn bộ nội dung trong `.output/public/` lên bất kỳ dịch vụ lưu trữ tĩnh nào như **Cloudflare Pages**, **Vercel**, **Netlify**, **GitHub Pages**, hoặc máy chủ **Nginx** cá nhân.

### 2.2 Cấu hình Nginx mẫu
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/typewords/.output/public;
    index index.html;

    # Nén Gzip cho các file JSON từ điển tĩnh
    gzip on;
    gzip_types application/json text/css application/javascript;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Bộ nhớ đệm dài hạn cho các bộ từ điển (vì dữ liệu từ vựng là bất biến)
    location /dicts/ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
```

### 2.3 Triển khai Docker Container
```dockerfile
# Giai đoạn Build
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm generate

# Giai đoạn Production Server
FROM nginx:alpine
COPY --from=builder /app/.output/public /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 3. Quản Trị Dữ Liệu & Đồng Bộ Đám Mây (Data Maintenance & Cloud Sync)

### 3.1 Dung lượng và hiệu năng bộ nhớ máy khách
* Tổng kích thước toàn bộ 194 bộ từ điển trên máy chủ là khoảng **150 MB**.
* **Cơ chế tải thông minh**: Ứng dụng **không tải toàn bộ 150 MB về máy người dùng cùng lúc**. Ứng dụng chỉ tải duy nhất tệp JSON của bộ từ điển mà người dùng chủ động bấm vào học (thường từ 200 KB đến 4 MB cho mỗi bộ).
* Dữ liệu tiến độ học tập và sổ từ lưu trong IndexedDB thường chỉ chiếm dưới **5 MB** trên trình duyệt của người học.

### 3.2 Cơ chế đồng bộ đám mây cá nhân qua Supabase (Tùy chọn)
Đối với người dùng muốn đồng bộ dữ liệu giữa máy tính ở nhà và cơ quan:
1. Tạo một dự án miễn phí tại [supabase.com](https://supabase.com/).
2. Vào phần **Cài đặt** -> **Đồng bộ** trên giao diện Type Words.
3. Điền thông tin `Supabase URL` và `Supabase Anon Key` cá nhân.
4. Bấm **Bắt đầu đồng bộ** để tự động lưu vết và hợp nhất dữ liệu hai chiều an toàn.
