# TypeWords — Data Inventory Baseline (Phase 0 Audit)

> **Thời điểm lập**: 2026-09-09  
> **Repository**: `Dyu20705/TypeWords`  
> **Kho dữ liệu khảo sát**: `public/dicts/en/word/`, `public/dicts/en/article/`, `public/list/`

---

## 1. Tổng Quan Kho Dữ Liệu Tĩnh (Static Data Overview)

* **Tổng số bộ từ điển**: 194 bộ từ điển tĩnh dạng JSON
* **Tổng số lượng từ vựng**: 277.529 bản ghi
* **Tổng dung lượng đĩa**: ~524 MB
* **Số tập bài đọc**: 4 tập New Concept English (348 bài đọc trọn bộ)
* **Ngôn ngữ mục tiêu**: Song ngữ Anh - Việt (bảo toàn 100% từ tiếng Anh gốc và câu ví dụ tiếng Anh gốc)

---

## 2. Phân Bổ Danh Mục Từ Điển (Category Distribution)

| Danh Mục | Số Bộ Từ Điển | Số Lượng Từ | Các Bộ Từ Điển Tiêu Biểu |
| :--- | :---: | :---: | :--- |
| **Luyện thi quốc tế** | 38 bộ | 89.412 từ | IELTS Core (3.575 từ), IELTS 7000, IELTS 807, TOEFL (4.263 từ), GRE 3000, GRE computer-based, GMAT, SAT, PTE Basic/Advanced, TOEIC, BEC 2/3, Oxford 3000/5000 |
| **Luyện thi Trung Quốc** | 45 bộ | 98.210 từ | CET-4 (2.607 từ), CET-6 (2.345 từ), TEM-4 (4.025 từ), TEM-8 (12.197 từ), Cao học (KaoYan), Cao khảo (GaoKao 3.500 từ), Tự học đại học |
| **Tiếng Anh phổ thông** | 109 bộ | 86.537 từ | Trọn bộ New Concept English 1-4, Longman Communication 3000, SGK Tiểu học, THCS, THPT (Nhân giáo PEP, Ngoại nghiên FLTRP, Oxford) |
| **Luyện tập lập trình** | 2 bộ | 3.365 từ | Tiếng Anh cho lập trình viên (`it-words.json`), Tiếng Anh tin học (`itVocabulary.json`) |

---

## 3. Cấu Trúc Bản Ghi Hiện Tại & Vấn Đề Ngữ Nghĩa

### 3.1 Cấu trúc đang lưu hành (`public/dicts/en/word/*.json`)
```json
{
  "id": 255,
  "word": "file",
  "phonetic0": "faɪl",
  "phonetic1": "faɪl",
  "trans": [
    {
      "pos": "n.",
      "cn": "tập tin; v. lưu tập tin",
      "cn_source": "文件；v.保存文件"
    }
  ],
  "sentences": [
    {
      "c": "Can you please send me the file?",
      "cn": "Bạn có thể gửi tệp tin cho tôi không?",
      "cn_source": "你能把文件发给我吗？"
    }
  ]
}
```

### 3.2 Vấn đề ngữ nghĩa cần giải quyết (Semantic Debt)
1. **Định danh ngôn ngữ sai lệch (`cn = Vietnamese`)**: Upstream quy ước `cn` là Chinese. Bản fork hiện đang gán bản dịch tiếng Việt vào `cn` và lưu tiếng Trung vào `cn_source` để duy trì hiển thị trên UI cũ. Đây là giải pháp chắp vá chỉ được chấp nhận ở dạng **Transitional Adapter**.
2. **Thiếu phiên âm IPA đồng nhất**: Một số từ điển thiếu phiên âm IPA Anh - Mỹ (`phonetic1: ""`). Cổng chất lượng QG-002 phải chuyển trường `phonetic` thành tùy chọn (optional) để tránh lỗi toàn bộ dataset.
3. **Hiện tượng trùng lặp từ trong upstream (Duplicate Entries)**:
   - `CET-4-Sub`: chứa 278 từ trùng lặp.
   - `张红岩的TOEFL词汇书`: chứa 472 từ trùng lặp.
   - $\to$ Cổng kiểm định QG-004 không thể áp đặt quy tắc cứng $Count_{in} == Count_{out}$, mà phải áp dụng **Source Accounting**:
     $$\text{input\_records} = \text{accepted} + \text{rejected} + \text{deduplicated}$$

---

## 4. Danh Mục Bài Đọc Song Ngữ (`public/dicts/en/article/`)

| Tệp Dữ Liệu | Bộ Bài Đọc | Số Lượng Bài | Số Từ / Câu | Trạng Thái Bản Dịch |
| :--- | :--- | :---: | :---: | :--- |
| `NCE_1.json` | New Concept English - Tập 1 | 144 bài | 1.872 câu | Song ngữ Anh - Việt, có mốc audio |
| `NCE_2.json` | New Concept English - Tập 2 | 96 bài | 2.418 câu | Song ngữ Anh - Việt, có mốc audio |
| `NCE_3.json` | New Concept English - Tập 3 | 60 bài | 1.980 câu | Song ngữ Anh - Việt, có mốc audio |
| `NCE_4.json` | New Concept English - Tập 4 | 48 bài | 1.720 câu | Song ngữ Anh - Việt, có mốc audio |

---

## 5. Kết Luận Data Baseline

1. Toàn bộ 194 bộ từ điển và 4 tập bài đọc đã sẵn sàng trên đĩa và có thể phục vụ ứng dụng runtime.
2. Cần chuyển đổi có trật tự: từ cấu trúc legacy `cn`/`cn_source` sang Canonical Schema `VocabularyEntry` thông qua bộ chuyển đổi tương thích tạm thời (**Transitional Legacy Adapter**) trước khi loại bỏ hoàn toàn mã cũ.
