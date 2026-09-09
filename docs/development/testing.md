# TypeWords — Quy Trình Kiểm Thử (Testing Guide)

Tài liệu này hướng dẫn cách thực thi bộ kiểm thử tự động và tiêu chuẩn chấp nhận mã nguồn của **TypeWords**.

---

## 1. Lệnh Kiểm Thử Toàn Diện

```bash
pnpm test
```
Lệnh này tự động thực thi chuỗi 3 kịch bản kiểm tra an toàn độc lập:
1. `node --strip-types scripts/lint-i18n.ts`: Kiểm tra tính đối xứng của 1.091 khóa i18n và phát hiện rò rỉ ký tự tiếng Trung trong `vi.json`.
2. `node --strip-types scripts/test-db-migration.ts`: Kiểm định 7 trường hợp di trú IndexedDB (bảo toàn FSRS, tính idempotent).
3. `node --strip-types scripts/check-hardcoded-zh.ts`: Quét hơn 140 tệp mã nguồn để bảo đảm không có chuỗi tiếng Trung hardcode trên giao diện.

---

## 2. Kiểm Định Tính Toàn Vẹn Kho Từ Điển

```bash
pnpm vocab:verify
```
Kiểm tra cấu trúc và tính sẵn sàng của 194 bộ từ điển tĩnh trong `public/dicts/en/word/`.

---

## 3. Lộ Trình Mở Rộng 4 Tầng Kiểm Thử (Phase 4)

Trong các pha tiếp theo, hệ thống kiểm thử sẽ phân tách thành:
* `tests/unit/`: Kiểm thử thuật toán bàn gõ, FSRS scheduler, bộ chuyển đổi schema.
* `tests/integration/`: Kiểm thử tầng Repository và di trú cơ sở dữ liệu IndexedDB thực tế.
* `tests/e2e/`: Kiểm thử luồng người dùng luyện gõ và lưu tiến độ trên trình duyệt headless.
* `scripts/checks/`: Các kịch bản linting và static analysis chuyên dụng.
