# TypeWords Cheatsheet — Phím Tắt & Cẩm Nang Sử Dụng

Tài liệu tra cứu nhanh các phím tắt, chế độ luyện tập, mẹo bộ gõ tiếng Việt và các lệnh quản trị dữ liệu từ vựng trong **TypeWords**.

---

## 1. Bảng Phím Tắt Mặc Định (Keyboard Shortcuts)

### Điều khiển luyện từ vựng & âm thanh
| Phím tắt | Chức năng | Mô tả chi tiết |
|---|---|---|
| `Ctrl + P` | Phát âm từ vựng | Phát lại audio phát âm US/UK của từ hiện tại |
| `Ctrl + 1` .. `9` | Đọc câu ví dụ 1–9 | Phát âm thanh câu ví dụ tương ứng |
| `Ctrl + Z` | Bật/tắt dịch nghĩa | Ẩn hoặc hiện nghĩa tiếng Việt của từ |
| `Ctrl + I` | Chế độ chính tả | Chuyển đổi giữa chế độ theo dõi và gõ chính tả |
| `Ctrl + M` | Chế độ tối giản | Ẩn bớt các khối giao diện phụ để tập trung gõ |
| `Ctrl + B` | Thanh công cụ | Bật hoặc tắt thanh công cụ phía trên |
| `Ctrl + L` | Bảng thông tin từ | Mở bảng chi tiết từ vựng (từ đồng nghĩa, từ nguyên) |
| `Ctrl + Q` | Đổi giao diện | Chuyển đổi theme Sáng / Tối / Tùy biến |
| `Ctrl + R` | Gõ ngẫu nhiên | Xáo trộn thứ tự từ vựng trong chương học |

### Điều hướng & thao tác từ
| Phím tắt | Chức năng | Mô tả chi tiết |
|---|---|---|
| `Ctrl + ⬅` | Từ trước đó | Quay lại từ liền trước |
| `Ctrl + ➡` | Từ tiếp theo | Chuyển nhanh sang từ tiếp theo |
| `Alt + ⬅` | Chương trước | Lùi về chương/bài học trước |
| `Alt + ➡` | Chương tiếp theo | Chuyển sang chương/bài học tiếp theo |
| `Escape` | Hiện từ (Gợi ý) | Hiện chữ cái tiếp theo hoặc hiện từ khi quên |
| `Tab` | Bỏ qua (Skip) | Bỏ qua từ hiện tại |
| `Enter` | Yêu thích | Thêm hoặc bỏ từ khỏi sổ **Yêu thích** (`wordCollect`) |
| `Shift + Enter` | Thêm vào sổ tùy chọn | Chọn sổ từ cá nhân để lưu từ vựng |
| `Shift + ➡` | Bước tiếp theo | Chuyển sang bước/giai đoạn học tiếp theo |
| `Ctrl + Enter` | Lặp lại chương | Học lại toàn bộ chương vừa hoàn thành |
| `Alt + Enter` | Chính tả chương | Chuyển toàn bộ chương sang chế độ nghe chính tả |

### Đánh giá & trắc nghiệm (Self-testing)
| Phím tắt | Chức năng | Mô tả chi tiết |
|---|---|---|
| `1` | Đã biết (Know) / Đáp án A | Đánh giá từ đã biết hoặc chọn đáp án A |
| `2` | Chưa biết (Unknown) / Đáp án B | Đưa vào sổ từ sai hoặc chọn đáp án B |
| `3` | Đã thuộc (Mastered) / Đáp án C | Đánh dấu đã thuộc (bỏ qua vĩnh viễn) hoặc chọn C |
| `4` | Đáp án D | Chọn đáp án D trong bài trắc nghiệm |
| `Alt + 1` .. `4` | Chọn đáp án tự kiểm tra | Chọn đáp án trắc nghiệm ở chế độ tự kiểm tra |

---

## 2. Các Chế Độ Luyện Tập (Practice Modes)

1. **Theo dõi (Follow-along)**:
   - Hiển thị đầy đủ từ tiếng Anh, phiên âm, giải nghĩa tiếng Việt.
   - Người dùng gõ theo mẫu để làm quen mặt chữ, phát âm và vị trí ngón tay.
2. **Chính tả (Dictation)**:
   - Ẩn từ tiếng Anh, chỉ phát âm thanh và hiển thị nghĩa tiếng Việt.
   - Thử thách nghe và gõ lại chính xác từ vựng vào ô nhập.
3. **Tự kiểm tra (Self-testing)**:
   - Hệ thống đưa ra câu hỏi trắc nghiệm ngữ nghĩa 4 đáp án (A, B, C, D).
   - Dùng các phím `1`, `2`, `3`, `4` để chọn nhanh.
4. **Nhớ viết (Spelling from memory)**:
   - Chỉ dựa vào gợi ý nghĩa tiếng Việt hoặc câu ngữ cảnh để gõ lại toàn bộ từ vựng.
5. **Thuật toán FSRS (Free Spaced Repetition Scheduler)**:
   - Tính toán chu kỳ lặp lại ngắt quãng khoa học dựa trên mức độ ghi nhớ của bạn (Again, Hard, Good, Easy).

---

## 3. Quản Lý Sổ Từ Hệ Thống (System Books)

TypeWords sử dụng định danh bất biến (Locale-Neutral ID) trong cơ sở dữ liệu IndexedDB:

* **Sổ từ yêu thích (`wordCollect`)**: Lưu trữ các từ vựng bạn muốn ôn tập chuyên sâu.
* **Sổ từ sai (`wordWrong`)**: Tự động thu thập từ bạn gõ sai trong quá trình luyện tập để nhắc nhở học lại.
* **Sổ từ đã thuộc (`wordKnown`)**: Lưu các từ bạn đã làm chủ hoàn toàn; những từ này sẽ **tự động không xuất hiện** trong các bài luyện tập tiếp theo để tiết kiệm thời gian.
* **Sổ bài đọc yêu thích (`articleCollect`)**: Đánh dấu các bài văn mẫu, bài đọc hay.

---

## 4. Bảng Tra Cứu Lệnh Quản Trị Từ Vựng (Vocabulary CLI)

Dành cho nhà phát triển hoặc người muốn mở rộng/quản lý kho từ điển:

```bash
# Khám phá danh mục gốc và xuất file inventory.json
pnpm vocab:discover

# Tải toàn bộ 194 bộ từ điển về thư mục public/dicts/en/word/
pnpm vocab:fetch

# Kiểm tra tính hợp lệ cú pháp JSON và trường dữ liệu bắt buộc
pnpm vocab:validate

# Chuyển ngữ danh mục từ điển sang tiếng Việt (public/list/word.json)
pnpm vocab:localize

# Dịch nghĩa Trung -> Việt một bộ từ điển cụ thể
pnpm vocab:translate --file <tên_tệp.json>

# Dịch các bộ từ điển ưu tiên (CET-4, CET-6, IELTS, TOEFL, Coder, NCE...)
pnpm vocab:translate --priority

# Dịch toàn bộ các bộ từ điển còn lại trong kho
pnpm vocab:translate --all

# Kiểm tra tính toàn vẹn và xuất bảng đối chuẩn benchmark
pnpm vocab:verify

# Kiểm thử luồng người dùng thực tế với máy chủ đang chạy
node --strip-types scripts/vocabulary/test-user-flow.ts
```

---

## 5. Mẹo Bộ Gõ Tiếng Việt (Vietnamese IME Tips)

Khi học gõ tiếng Anh trên TypeWords mà bạn vẫn đang bật bộ gõ tiếng Việt (Unikey, EVKey, OpenKey hoặc ibus/fcitx trên Linux):

* **Không cần tắt bộ gõ**: Bản fork đã tối ưu hóa typing engine để không kích hoạt cảnh báo đổi bộ gõ khó chịu.
* **Mẹo gõ từ có nguyên âm lặp** (ví dụ: `look`, `beer`, `good`, `free`):
  - Khuyến nghị chuyển Unikey/EVKey sang chế độ gõ tiếng Anh (`Ctrl + Shift` hoặc `Alt + Z`) để đạt tốc độ gõ cao nhất và không bị trễ ký tự dấu.
  - Nếu muốn giữ nguyên tiếng Việt, TypeWords tự động xử lý phím backspace thông minh để hoàn nguyên ký tự bị gõ dính dấu.

---

## 6. Sao Lưu & Đồng Bộ Dữ Liệu

* **Lưu trữ cục bộ (Mặc định)**: Dữ liệu học tập, lịch sử gõ và sổ từ được lưu trực tiếp vào trình duyệt qua `IndexedDB` (`idb-keyval`). Không cần kết nối Internet, bảo mật tuyệt đối.
* **Đồng bộ đám mây (Tùy chọn)**: Trong mục **Cài đặt** -> **Đồng bộ**, bạn có thể cấu hình tài khoản Supabase cá nhân để đồng bộ hóa dữ liệu giữa máy tính ở nhà và văn phòng.
