# TypeWords — Hệ Thống Cổng Kiểm Định Chất Lượng 3 Tầng (Quality Gates Specification)

Tài liệu này định nghĩa chi tiết 3 tầng kiểm định chất lượng (Structural, Linguistic, Build) áp dụng cho toàn bộ dữ liệu từ vựng trong **TypeWords**.

---

## 1. Tầng 1: Structural QA (Cấu Trúc Dữ Liệu)

| Mã Cổng | Tên Cổng Kiểm Định | Tiêu Chí Đạt (Threshold) | Phương Pháp Kiểm Tra |
| :--- | :--- | :---: | :--- |
| **QG-001** | **Schema Validation** | **100%** | Kiểm tra khớp JSON Schema `VocabularyEntry` (TypeBox/Zod/Ajv) |
| **QG-002** | **Required Fields** | **0 vi phạm** | Bắt buộc phải có: `id`, `word`, `normalizedWord`, `definitions`. (`phonetic`, `examples`, `phrases` là tùy chọn) |
| **QG-003** | **Unique Word IDs** | **0 trùng lặp** | Kiểm tra không trùng ID hoặc headword trong cùng một bộ từ điển |
| **QG-004** | **Source Accounting** | **100% cân bằng** | Cân bằng toàn vẹn: $\text{input} = \text{accepted} + \text{rejected} + \text{deduplicated}$ kèm lý do cụ thể |

---

## 2. Tầng 2: Linguistic QA (Chất Lượng Dịch Thuật & Ngữ Nghĩa)

| Mã Cổng | Tên Cổng Kiểm Định | Tiêu Chí Đạt (Threshold) | Phương Pháp Kiểm Tra |
| :--- | :--- | :---: | :--- |
| **QG-005** | **Translation Coverage** | $\ge$ **99.8%** | Tỷ lệ bản ghi có nghĩa tiếng Việt hợp lệ trên các trường bắt buộc |
| **QG-006** | **No Empty Definitions** | **0 vi phạm** | Không chứa định nghĩa rỗng, khoảng trắng thừa hoặc chuỗi vô nghĩa (`""`, `" "`, `null`) |
| **QG-007** | **No Chinese Leakage** | **0 ký tự** | Quét biểu thức chính quy `[\u4e00-\u9fff\u3400-\u4dbf]` trong toàn bộ trường nghĩa tiếng Việt |
| **QG-008** | **Placeholder Parity** | **100%** | Bảo toàn các biến nội suy dạng `{name}`, `{0}` giữa câu nguồn và câu đích |
| **QG-010** | **Glossary Compliance** | **100%** | Tuân thủ tuyệt đối danh mục thuật ngữ; không chứa các từ trong `forbidden_translations` |
| **QG-011** | **Anomaly Detection** | Cảnh báo | Phát hiện độ dài dịch bất thường (>100 từ cho 1 từ vựng), lặp từ lặp nghĩa |
| **QG-012** | **POS Consistency** | $\ge$ **95%** | Từ loại bản dịch tương ứng với từ loại của headword tiếng Anh |
| **QG-013** | **Sense Disambiguation** | Kiểm tra mẫu | Phân biệt đúng ngữ cảnh chuyên ngành |
| **QG-014** | **Translation Provenance**| **100%** | Bản ghi phải lưu vết phương thức (`method: tm / glossary / llm`) và trạng thái duyệt |

---

## 3. Tầng 3: Build & Publish QA (Đóng Gói & Xuất Bản)

| Mã Cổng | Tên Cổng Kiểm Định | Tiêu Chí Đạt (Threshold) | Phương Pháp Kiểm Tra |
| :--- | :--- | :---: | :--- |
| **QG-009** | **Deterministic Output** | **100%** | Chạy lặp lại pipeline trên cùng dữ liệu đầu vào sinh ra checksum giống hệt nhau |
| **QG-015** | **Checksum Verification**| **100%** | Mã băm SHA-256 của từng tệp từ điển được lưu và đối chiếu qua manifest |
| **QG-016** | **Manifest Parity** | **100%** | Danh mục `public/list/word.json` khớp chính xác 194 tệp trong `public/dicts/en/word/` |
| **QG-017** | **Staged Publish** | **100% an toàn** | Xuất bản qua vùng đệm `data/staging/`; chỉ ghi đè `public/` khi toàn bộ tệp đều đạt chuẩn |
