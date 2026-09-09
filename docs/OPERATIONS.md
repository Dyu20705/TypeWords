# Type Words — Hướng Dẫn Vận Hành & Pipeline (Operations Guide)

Tài liệu này cung cấp quy trình vận hành chi tiết về đường ống dữ liệu từ vựng (Vocabulary Pipeline), đóng gói triển khai (Deployment), tối ưu hóa lưu trữ và cơ chế đồng bộ dữ liệu.

---

## 1. Đường Ống Dữ Liệu Từ Vựng (Vocabulary Pipeline)

Dự án trang bị đường ống dữ liệu tại `scripts/data/` để quản lý, chuẩn hóa, dịch thuật và xuất bản an toàn toàn bộ 194 bộ từ điển (277.529 từ).

```
┌────────────────────────────────────────────────────────────────────────┐
│                        VOCABULARY PIPELINE FLOW                        │
│                                                                        │
│   [ 1. data:discover ]  ───► Quét catalog 194 bộ từ điển               │
│            │                                                           │
│            ▼                                                           │
│   [ 2. data:fetch ]     ───► Kiểm tra & tải nguồn thô vào data/sources │
│            │                                                           │
│            ▼                                                           │
│   [ 3. data:normalize ] ───► Chuẩn hóa VocabularyEntry & cân đối QG-004│
│            │                                                           │
│            ▼                                                           │
│   [ 4. data:translate ] ───► Dịch ngữ cảnh, áp dụng TM & Glossary      │
│            │                                                           │
│            ▼                                                           │
│   [ 5. data:validate ]  ───► Chạy 3 Tầng Quality Gates (13 cổng)       │
│            │                                                           │
│            ▼                                                           │
│   [ 6. data:publish ]   ───► Xuất bản staging, SHA-256 & rollback safe │
└────────────────────────────────────────────────────────────────────────┘
```

### 1.1 Khám phá danh mục (`pnpm data:discover`)
* **Lệnh thực thi**:
  ```bash
  pnpm data:discover
  ```
* **Chức năng**: Quét danh mục từ điển production (`data/sources/catalogs/production-catalog.json`), phân loại theo chuyên mục và tạo bảng kê tồn kho `data/manifests/inventory.json`.

### 1.2 Kiểm tra nguồn dữ liệu (`pnpm data:fetch`)
* **Lệnh thực thi**:
  ```bash
  pnpm data:fetch
  ```
* **Chức năng**: Kiểm tra tính sẵn sàng của 194 tệp từ điển nguồn thô trên đĩa cục bộ (`data/sources/raw/` hoặc `public/dicts/en/word/`).

### 1.3 Chuẩn hóa Schema & Cân đối kế toán nguồn (`pnpm data:normalize`)
* **Lệnh thực thi**:
  ```bash
  pnpm data:normalize
  ```
* **Chức năng**:
  - Chuyển đổi bản ghi từ dạng legacy sang canonical `VocabularyEntry`.
  - Thực hiện cân đối kế toán nguồn (QG-004): $\text{sourceCount} = \text{acceptedCount} + \text{rejectedCount} + \text{deduplicatedCount}$.
  - Ghi nhận chi tiết từng từ bị loại trừ/trùng lặp vào `data/manifests/source-accounting.json`.
  - Xuất dữ liệu đã chuẩn hóa vào `data/normalized/`.

### 1.4 Dịch thuật ngữ cảnh & Gắn thẻ xuất xứ (`pnpm data:translate`)
* **Lệnh thực thi**:
  ```bash
  pnpm data:translate
  ```
* **Chức năng**:
  - Áp dụng bộ nhớ dịch Translation Memory (`data/translation-memory/approved.jsonl`) và cache dịch thuật (`scripts/vocabulary/.translation-cache.json` với 166.182 mục).
  - Áp dụng quy tắc thuật ngữ chuẩn `data/translation-memory/glossary.vi.json` (tự động thay thế thuật ngữ cấm).
  - Gắn metadata xuất xứ (`provenance`) cho từng định nghĩa (`method: 'tm' | 'glossary' | 'manual'`, `reviewStatus: 'approved' | 'pending'`).
  - Cắt gọt tự nhiên các chuỗi giải nghĩa ngữ pháp dài quá 250 ký tự tại ranh giới dấu câu (QG-011).
  - Xuất dữ liệu bản địa hóa vào `data/localized/`.

### 1.5 Kiểm định chất lượng 3 tầng Quality Gates (`pnpm data:validate`)
* **Lệnh thực thi**:
  ```bash
  pnpm data:validate
  ```
* **Chức năng**:
  - Thực thi kiểm định nghiêm ngặt:
    - **Tier 1 (Structural)**: QG-001 (Schema validation toàn diện), QG-002 (Required fields), QG-003 (Unique headwords), QG-004 (Tái tính toán độc lập cân đối nguồn thô).
    - **Tier 2 (Linguistic)**: QG-005 (Độ bao phủ bản dịch), QG-006 (Không rỗng), QG-007 (Không rò rỉ ký tự Trung trong trường tiếng Việt), QG-010 (Glossary compliance), QG-011 (Độ dài $\le$ 250 chars), QG-012 (POS consistency), QG-013 (Audit chuyên ngành), QG-014 (Provenance tagging).
    - **Tier 3 (Catalog Parity)**: QG-016 (Đối chiếu định danh chính xác 194/194 tệp).
  - Xuất báo cáo chi tiết vào `data/manifests/quality-report.json`.

### 1.6 Xuất bản an toàn qua Staging & Checksums (`pnpm data:publish`)
* **Lệnh thực thi**:
  ```bash
  pnpm data:publish
  ```
* **Chức năng**:
  - Biên dịch dữ liệu từ `data/localized/` sang định dạng runtime legacy thông qua `LegacyWordAdapter`.
  - Ghi vào vùng đệm trung gian `data/staging/`.
  - Sinh mã băm SHA-256 cho từng tệp vào `data/manifests/checksums.sha256` (QG-015).
  - Tạo snapshot sao lưu `public/dicts/en/word.pre-publish-backup/`.
  - Sao chép tệp sang `public/dicts/en/word/`.
  - Kiểm tra đối chiếu mã băm sau khi xuất bản (QG-017). Tự động rollback phục hồi nguyên trạng nếu có lỗi.
  - Xuất báo cáo tại `data/manifests/publish-report.json`.

### 1.7 Chạy toàn bộ quy trình tự động (`pnpm data:all`)
* **Lệnh thực thi**:
  ```bash
  pnpm data:all
  ```
* Thực thi tuần tự từ bước 1 đến bước 6.

*Ghi chú: Các lệnh tiền tố `vocab:*` (`vocab:discover`, `vocab:validate`, ...) được duy trì làm alias tương thích ngược.*

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
