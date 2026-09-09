# ADR-002: Sử Dụng Bộ Chuyển Đổi Quá Độ (Transitional Legacy Adapter) Cho Schema Từ Vựng

> **Trạng thái**: Đã phê duyệt (Approved)  
> **Thời điểm**: 2026-09-09  
> **Người đề xuất**: Antigravity AI & Maintainer

---

## 1. Bối Cảnh (Context)
Trong phiên bản gốc upstream, mỗi bản ghi từ vựng có cấu trúc:
```json
{
  "word": "abandon",
  "trans": [{ "pos": "v.", "cn": "放弃" }]
}
```
Khi thực hiện bản địa hóa tiếng Việt, bản fork đã chuyển nghĩa tiếng Việt vào trường `cn` và lưu nghĩa tiếng Trung vào `cn_source`:
```json
{
  "word": "abandon",
  "trans": [{ "pos": "v.", "cn": "từ bỏ", "cn_source": "放弃" }]
}
```
Điều này tạo ra một món nợ ngữ nghĩa nghiêm trọng: **`cn` (viết tắt của Chinese) lại chứa tiếng Việt (Vietnamese)**.

Mặt khác, nếu lập tức sửa đổi toàn bộ các component Vue trong `app/` để sử dụng schema mới `VocabularyEntry` (`definitions[].vi`), rủi ro hồi quy (regression) và vỡ giao diện là cực kỳ cao.

---

## 2. Quyết Định Kiến Trúc (Decision)
1. Xác lập khế ước chuẩn tắc mới cho dữ liệu: **`VocabularyEntry`** (`id`, `word`, `definitions: [{ pos, vi, en, zh, context }]`).
2. Xây dựng **`LegacyWordAdapter`** làm tầng chuyển đổi tương thích quá độ (Transitional Compatibility Layer) ở rìa nạp dữ liệu.
3. Các component Vue hiện hữu tạm thời tiếp tục nhận dữ liệu thông qua adapter này.
4. Lên kế hoạch loại bỏ dần `LegacyWordAdapter` trong các pha tiếp theo khi các component gõ từ được nâng cấp tương thích hoàn toàn với `VocabularyEntry`.

---

## 3. Hệ Quả (Consequences)
* **Tích cực**:
  - Giao diện người dùng và bàn gõ tiếp tục hoạt động 100% ổn định trong suốt quá trình tái cấu trúc (Không cần UI Rewrite).
  - Tầng dữ liệu mới được giải phóng khỏi quy ước đặt tên sai lệch `cn`.
* **Tiêu cực / Ràng buộc**:
  - Tốn một chi phí ánh xạ nhỏ trong bộ nhớ khi nạp từ điển vào phiên học.
  - Phải có tài liệu cảnh báo để các nhà phát triển sau này không nhầm lẫn coi `LegacyWordAdapter` là kiến trúc đích vĩnh viễn.
