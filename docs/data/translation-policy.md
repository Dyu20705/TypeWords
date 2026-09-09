# TypeWords — Chính Sách Dịch Thuật & Quản Lý Thuật Ngữ (Translation Policy)

Tài liệu này quy định các tiêu chuẩn ngôn ngữ, chính sách thuật ngữ và quy trình kiểm soát chất lượng dịch nghĩa từ vựng tiếng Anh sang tiếng Việt trong **TypeWords**.

---

## 1. Nguyên Tắc Cốt Lõi (Core Principles)

1. **Bảo tồn 100% Từ Tiếng Anh Gốc**:
   - Từ tiếng Anh (`word`), phiên âm IPA và câu ví dụ tiếng Anh gốc là bất khả xâm phạm; không bao giờ bị thay đổi hay biến dạng trong quá trình dịch.
2. **Dịch Thuật Theo Ngữ Nghĩa & Ngữ Cảnh (Sense-Based Translation)**:
   - Một từ tiếng Anh đa nghĩa phải được dịch chính xác theo chuyên ngành hoặc ngữ cảnh của bộ từ điển (vd: `bank` trong từ điển tài chính là *ngân hàng*, trong từ điển địa lý là *bờ sông*).
3. **Thống Nhất Từ Loại (POS Consistency)**:
   - Bản dịch tiếng Việt phải tương ứng đúng với từ loại của headword tiếng Anh (Danh từ dịch theo danh từ, Động từ dịch theo động từ).
4. **Bảo Tồn Vết Nguồn (Traceability / Provenance)**:
   - Luôn lưu vết chuỗi tiếng Trung gốc đối chiếu vào trường `zh` hoặc `cn_source` để phục vụ công tác rà soát.

---

## 2. Bảng Thuật Ngữ Chuẩn (Glossary Policy)

Tất cả các bản dịch bắt buộc phải tuân thủ bảng thuật ngữ tại `data/translation-memory/glossary.vi.json`. Các từ vi phạm `forbidden_translations` sẽ bị Quality Gates QG-010 chặn lại ngay lập tức.

### Một số ví dụ điển hình:
| Từ / Cụm Từ | Thuật Ngữ Chuẩn (Preferred) | Thuật Ngữ Cấm Dịch (Forbidden) | Ngữ Cảnh |
| :--- | :--- | :--- | :--- |
| `application form` | đơn đăng ký, đơn xin việc | biểu mẫu ứng dụng | Hành chính |
| `compound interest` | lãi kép | lãi suất hợp chất | Tài chính |
| `part of speech` | từ loại | phần của lời nói | Ngữ pháp |
| `phrasal verb` | cụm động từ | động từ cụm | Ngữ pháp |
| `file` (danh từ CNTT) | tệp, tệp tin, hồ sơ | dũa, cái giũa | CNTT |
| `cursor` | con trỏ | người chạy | CNTT |

---

## 3. Quy Trình Phê Duyệt Bản Dịch (Review Workflow)

```text
Bản dịch mới (LLM / Transformation)
           ↓
Quét tự động Quality Gates (Structural & Linguistic)
           ↓
Kiểm tra đối chiếu Glossary
           ↓
Đưa vào trạng thái: pending
           ↓
Người duy trì duyệt thủ công (Human Review)
           ↓
Lưu vào data/translation-memory/approved.jsonl
```
Bản ghi đã nằm trong `approved.jsonl` sẽ được tái sử dụng vĩnh viễn trong các lần biên dịch tiếp theo.
