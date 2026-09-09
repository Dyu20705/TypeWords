# TypeWords — Quy Trình Kỹ Nghệ Dữ Liệu Từ Vựng (Vocabulary Pipeline)

Tài liệu này đặc tả quy trình kỹ nghệ dữ liệu từ vựng độc lập (**Data Pipeline**) nhằm xây dựng, chuẩn hóa và xuất bản 194 bộ từ điển tĩnh cho **TypeWords**.

---

## 1. Chuỗi Pipeline Chuẩn Hóa (`pnpm data:*`)

```text
┌─────────────────────────┐
│   01. DATA:DISCOVER     │  Quét danh mục nguồn upstream, trích xuất metadata
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│   02. DATA:FETCH        │  Tải các bộ dữ liệu thô (raw JSON) về data/sources/
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│   03. DATA:NORMALIZE    │  Chuẩn hóa về canonical schema, lọc trùng, sinh rejected log
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│   04. DATA:TRANSLATE    │  Dịch thuật ngữ cảnh có kiểm soát (Glossary + Translation Memory)
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│   05. DATA:VALIDATE     │  Chạy 3 tầng Quality Gates (Structural, Linguistic, Build)
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│   06. DATA:PUBLISH      │  Xuất bản qua Staging: staging → checksum → public/dicts/
└─────────────────────────┘
```

---

## 2. Các Bước Thực Thi Chi Tiết

### Bước 1: Khảo sát nguồn (`pnpm data:discover`)
* Đầu vào: `data/sources/production-catalog.json`.
* Đầu ra: `data/manifests/inventory.json` (danh sách 194 bộ từ điển kèm URL và metadata).

### Bước 2: Tải dữ liệu thô (`pnpm data:fetch`)
* Tải các tệp từ điển chưa có cục bộ từ CDN nguồn.
* Lưu dữ liệu thô vào `data/sources/raw/`.

### Bước 3: Chuẩn hóa Schema (`pnpm data:normalize`)
* Chuyển đổi định dạng nguồn sang `VocabularyEntry`.
* Thực hiện **Source Accounting**:
  $$\text{input} = \text{accepted} + \text{rejected} + \text{deduplicated}$$
* Xuất log chi tiết các từ bị loại bỏ vào `data/manifests/source-accounting.json`.

### Bước 4: Dịch thuật ngữ cảnh (`pnpm data:translate`)
* Áp dụng bảng thuật ngữ cố định `data/translation-memory/glossary.vi.json`.
* Tái sử dụng bản dịch đã duyệt trong `data/translation-memory/approved.jsonl`.
* Ghi nhận xuất xứ dịch thuật (`method: "tm" | "glossary" | "llm"`).

### Bước 5: Kiểm định chất lượng (`pnpm data:validate`)
* Thực thi toàn bộ các bài test của 3 tầng Quality Gates (QG-001 đến QG-017).
* Xuất báo cáo nghiệm thu tại `data/manifests/quality-report.json`.

### Bước 6: Xuất bản an toàn (`pnpm data:publish`)
* Đưa dữ liệu hợp lệ vào vùng đệm `data/staging/`.
* Tính toán mã băm SHA-256 cho từng tệp.
* Chỉ đồng bộ vào `public/dicts/en/word/` khi 100% tệp staging đều hợp lệ.
* Xác thực lại tệp đã xuất bản (Published file verification).
