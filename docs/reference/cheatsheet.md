# TypeWords — Cẩm Nang Phím Tắt & Tra Cứu Nhanh (Cheatsheet)

Tài liệu này tổng hợp danh mục phím tắt, lệnh CLI và cấu trúc tra cứu nhanh dành cho người dùng và lập trình viên **TypeWords**.

---

## 1. Phím Tắt Trong Phòng Luyện Gõ (Typing Shortcuts)

| Phím Tắt | Chức Năng | Ghi Chú |
| :--- | :--- | :--- |
| `Space` | Chuyển sang từ tiếp theo | Tự động phát âm từ nếu bật tính năng |
| `Backspace` | Xóa ký tự vừa gõ sai | Cho phép sửa lỗi gõ |
| `Enter` | Phát lại âm thanh từ hiện tại | Nạp lại phát âm giọng chuẩn |
| `Ctrl + J` / `Ctrl + K` | Chuyển bài / chuyển trang | Điều hướng nhanh |
| `Escape` | Tạm dừng phiên gõ phím | Hiện bảng tạm dừng |
| `Ctrl + B` | Đánh dấu yêu thích từ hiện tại | Thêm vào sổ từ `wordCollect` |
| `Ctrl + M` | Đánh dấu đã thành thạo từ | Chuyển sang sổ `wordKnown` |

---

## 2. Lệnh CLI Quản Lý Dữ Liệu (Data Pipeline Commands)

```bash
# Quy trình chuẩn kỹ nghệ dữ liệu:
pnpm data:discover   # 01: Quét nguồn và lập danh mục inventory
pnpm data:fetch      # 02: Tải dữ liệu thô từ CDN
pnpm data:normalize  # 03: Chuẩn hóa schema và lọc trùng
pnpm data:translate  # 04: Dịch thuật có kiểm soát (Glossary + TM)
pnpm data:validate   # 05: Kiểm tra 3 tầng Quality Gates
pnpm data:publish    # 06: Xuất bản an toàn qua staging vào public/dicts/
pnpm data:all        # Chạy toàn bộ chuỗi pipeline tuần tự

# Lệnh kiểm tra an toàn mã nguồn:
pnpm test            # Chạy toàn bộ bộ test kiểm định
pnpm test:db         # Kiểm tra di trú IndexedDB
pnpm test:zh         # Quét chuỗi tiếng Trung hardcode
pnpm lint:i18n       # Kiểm tra đối xứng tệp i18n
```

---

## 3. Các Đường Dẫn Tài Nguyên Trọng Yếu

* **Kho từ điển tĩnh**: `public/dicts/en/word/*.json`
* **Kho bài đọc tĩnh**: `public/dicts/en/article/*.json`
* **Danh mục từ điển**: `public/list/word.json`
* **Danh mục bài đọc**: `public/list/article.json`
* **Ngữ liệu i18n**: `i18n/locales/vi.json` & `en.json`
* **Bảng thuật ngữ chuẩn**: `data/translation-memory/glossary.vi.json`
* **Bộ nhớ dịch đã duyệt**: `data/translation-memory/approved.jsonl`
