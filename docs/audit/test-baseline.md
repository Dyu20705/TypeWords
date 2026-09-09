# TypeWords — Test Baseline & Quality Assessment (Phase 0 Audit)

> **Thời điểm lập**: 2026-09-09  
> **Repository**: `Dyu20705/TypeWords`  
> **Lệnh kiểm tra hiện tại**: `pnpm test` (`lint-i18n.ts` && `test-db-migration.ts` && `check-hardcoded-zh.ts`)

---

## 1. Hiện Trạng Bộ Kiểm Thử Hiện Tại (Current Test Suite)

| Kịch Bản Kiểm Thử | Tệp Nguồn | Mục Tiêu & Cơ Chế Kiểm Tra | Trạng Thái Baseline | Điểm Còn Khuyết (Gaps) |
| :--- | :--- | :--- | :---: | :--- |
| **`pnpm lint:i18n`** | `scripts/lint-i18n.ts` | Đối xứng 1.091 khóa giữa `vi.json` và `en.json`; quét 0 ký tự Trung Quốc trong `vi.json` | **PASS** (1.091/1.091 keys) | Chưa kiểm tra tính đối xứng của biến nội suy placeholder (`{name}`, `{count}`) |
| **`pnpm test:db`** | `scripts/test-db-migration.ts` | 7 bài test đơn vị: di trú ID tiếng Trung/Anh sang `wordCollect`, `wordWrong`, `wordKnown`; bảo toàn FSRS; tính idempotent | **PASS** (7/7 tests) | Chạy trên mock JavaScript object trong bộ nhớ, chưa kiểm thử qua IndexedDB engine thực |
| **`pnpm test:zh`** | `scripts/check-hardcoded-zh.ts` | Quét regex `[\u4e00-\u9fa5]` trên hơn 140 tệp `.vue` và `.ts` trong `app/` | **PASS** (0 lỗi template) | Phải duy trì một danh sách allowlist (9 tệp) do còn tồn dư chuỗi tiếng Trung ở migration và audio hooks |
| **`pnpm vocab:verify`** | `scripts/vocabulary/verify-integrity.ts` | Kiểm tra 194 bộ từ điển tĩnh, cấu trúc trường `word`, `trans`, `phonetic`, `sentences` | **PASS** (970/970 checks) | Chỉ kiểm tra lấy mẫu (5 từ/bộ từ điển), chưa kiểm định toàn diện 277.529 bản ghi qua JSON schema |

---

## 2. Đánh Giá Kiến Trúc Kiểm Thử (Test Architecture Evaluation)

### 2.1 Điểm Mạnh Đã Có
1. Dự án đã có ý thức tự động hóa kiểm tra i18n, DB migration và scan chuỗi tiếng Trung trước khi commit.
2. Script chạy siêu tốc nhờ cờ native `node --strip-types` (Node.js 22+), không phụ thuộc bundler phức tạp.
3. Cơ chế di trú idempotent đã được kiểm chứng tự động không làm mất dữ liệu người dùng cũ.

### 2.2 Các Khiếm Khuyết Kiến Trúc (Architecture Deficits)
1. **Chưa có Test Runner chuẩn**: Không có Vitest hoặc Jest; các bài test được viết dưới dạng console script kèm `assert.strictEqual`.
2. **Thiếu Unit Test cho Core Domain**:
   - Typing Engine state machine chưa có bài test tự động mô phỏng chuỗi gõ phím, xử lý IME Unikey/EVKey, tính WPM và tỷ lệ gõ sai.
   - FSRS Scheduler chưa có bài test toán học kiểm định tính chính xác của khoảng cách ngày ôn tập theo công thức FSRS v5.
3. **Thiếu E2E Smoke Tests**: Chưa có kiểm thử tự động trên trình duyệt thật (Playwright) cho luồng: Mở web $\to$ Gõ từ $\to$ Sai từ $\to$ Lưu từ sai $\to$ Reload $\to$ Khôi phục trạng thái.

---

## 3. Lộ Trình Nâng Cấp Bộ Kiểm Thử (Phase 4 Plan)

1. Thiết lập cấu trúc 4 tầng:
   - `tests/unit/`: Chuyên biệt cho Typing state machine, FSRS scheduler, Schema validators.
   - `tests/integration/`: Chuyên biệt cho Repository, IndexedDB persistence, Migration runner.
   - `tests/e2e/`: Chuyên biệt cho Critical User Journey trên trình duyệt headless.
   - `scripts/checks/`: Các cổng kiểm định tĩnh (lint-i18n, check-zh, audit-deps).
2. Tích hợp GitHub Actions CI để chặn đứng mọi PR vi phạm quality gates.
