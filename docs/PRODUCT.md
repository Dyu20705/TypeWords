# Type Words — Tài Liệu Sản Phẩm (Product Documentation)

Tài liệu này trình bày chi tiết về tầm nhìn, chân dung người dùng, phương pháp học tập, tính năng cốt lõi và lộ trình phát triển của **Type Words** — bản phân phối Việt hóa tối ưu cho người học tiếng Anh tại Việt Nam.

---

## 1. Tầm Nhìn & Triết Lý Sản Phẩm (Product Vision)

### 1.1 Mục tiêu dự án
**Type Words** hướng đến mục tiêu trở thành **công cụ luyện gõ và ghi nhớ từ vựng tiếng Anh mã nguồn mở hiệu quả nhất dành riêng cho người Việt Nam**. Dự án kết hợp phản xạ gõ phím cơ học với các thuật toán khoa học não bộ để biến việc học từ vựng trở nên trực quan, phản xạ tự nhiên và bền vững.

### 1.2 Triết lý thiết kế cốt lõi
1. **Local-First & Quyền riêng tư**: Mọi tiến trình học tập, lịch sử gõ và dữ liệu cá nhân được lưu trữ trực tiếp trên trình duyệt của người dùng (`IndexedDB`). Không bắt buộc đăng ký tài khoản, không theo dõi, không quảng cáo và không phụ thuộc vào máy chủ trung gian.
2. **Tối giản & Tập trung (Distraction-Free)**: Giao diện hiện đại, trực quan, hỗ trợ chế độ tối giản (`Zen Mode`) giúp người học hoàn toàn tập trung vào mặt chữ, âm thanh và chuyển động của ngón tay.
3. **Dựa trên Khoa học Nhận thức**: Tận dụng trí nhớ vận động (motor memory) thông qua gõ phím kết hợp với mô hình lặp lại ngắt quãng FSRS (*Free Spaced Repetition Scheduler*) để chống lại đường cong quên lãng Ebbinghaus.
4. **Bản địa hóa Chuyên sâu cho Người Việt**: Dịch nghĩa tự nhiên, giữ nguyên bản chất học liệu tiếng Anh, loại bỏ hoàn toàn các rào cản từ nền tảng nội địa Trung Quốc của bản gốc, đồng thời tối ưu hóa trải nghiệm gõ phím với các bộ gõ tiếng Việt phổ biến (Unikey, EVKey).

---

## 2. Đối Tượng Người Dùng (Target Personas)

| Nhóm người học | Mục tiêu học tập | Bộ từ điển đề xuất |
|---|---|---|
| **Học sinh & Ôn thi THPT Quốc gia** | Nắm chắc từ vựng theo khung chương trình, nâng cao điểm số các kỳ thi tốt nghiệp và đại học. | New Concept English 1–4, Từ vựng SGK các cấp, Oxford 3000/5000. |
| **Thí sinh Chứng chỉ Quốc tế** | Đạt target điểm IELTS (6.5–8.0+), TOEFL, TOEIC, GRE 3000, SAT, GMAT, PTE. | IELTS Core, TOEFL Core, GRE 3000, GMAT, PTE ApeUni, TOEIC. |
| **Lập trình viên & Kỹ sư CNTT** | Đọc hiểu tài liệu kỹ thuật, đặt tên biến chuẩn tiếng Anh, giao tiếp trong môi trường công nghệ quốc tế. | Từ vựng Lập trình viên (`it-words.json`), Tiếng Anh Khoa học Máy tính (`itVocabulary.json`). |
| **Người đi làm & Tự học tiếng Anh** | Nâng cao vốn từ vựng giao tiếp thực tế, phản xạ nhanh khi gõ email và văn bản tiếng Anh. | Longman Communication 3000, Duolingo Vocabulary (B1, B2, C1), VOA English. |

---

## 3. Phương Pháp Học Tập & Tính Năng Cốt Lõi

### 3.1 Cơ chế Ghi nhớ qua Luyện gõ (Typing-based Memorization)
Việc học từ qua gõ phím kích thích đồng thời 3 giác quan và cơ chế thần kinh:
* **Thị giác (Visual)**: Quan sát mặt chữ, phiên âm quốc tế IPA và nghĩa tiếng Việt.
* **Thính giác (Auditory)**: Lắng nghe phát âm chuẩn bản xứ (Mỹ/Anh) ngay khi bắt đầu từ và sau khi hoàn thành.
* **Vận động cơ học (Kinesthetic / Motor Memory)**: Ngón tay lặp lại chuỗi phím bấm, khắc sâu thứ tự ký tự vào phản xạ vô điều kiện.

### 3.2 Bốn Chế Độ Luyện Từ Vựng (Practice Modes)
1. **Theo dõi (Follow-along Mode)**:
   - Hiển thị đầy đủ chữ tiếng Anh mờ làm nền, phiên âm và nghĩa tiếng Việt.
   - Người học gõ đè lên ký tự mẫu. Phù hợp cho việc làm quen từ vựng mới hoặc người mới bắt đầu.
2. **Nghe chính tả (Dictation Mode)**:
   - Ẩn hoàn toàn chữ tiếng Anh, chỉ phát âm thanh và hiển thị nghĩa tiếng Việt.
   - Người học phải lắng nghe và tự gõ lại chính xác từ vựng. Tăng cường khả năng nhận diện âm thanh.
3. **Tự kiểm tra trắc nghiệm (Self-testing Mode)**:
   - Hiển thị từ tiếng Anh và đưa ra 4 phương án nghĩa trắc nghiệm (A, B, C, D).
   - Chọn nhanh bằng các phím `1`, `2`, `3`, `4`. Kiểm tra nhanh độ nhớ nghĩa trước khi bước vào luyện gõ.
4. **Nhớ viết (Spelling from Memory)**:
   - Chỉ cung cấp nghĩa tiếng Việt hoặc gợi ý ngữ cảnh; người học phải nhớ lại hoàn toàn mặt chữ để gõ.

### 3.3 Thuật Toán Lặp Lại Ngắt Quãng FSRS
TypeWords tích hợp thuật toán **FSRS (Free Spaced Repetition Scheduler)** — mô hình hiện đại hơn SM-2 (Anki):
* Đánh giá độ nhớ qua 4 mức độ: *Again (Học lại)*, *Hard (Khó)*, *Good (Tốt)*, *Easy (Dễ)*.
* Thuật toán tự động đo lường độ ổn định (stability) và độ khó (difficulty) của từng từ để xếp lịch ôn tập tối ưu.
* Tiết kiệm tới 40% thời gian học so với việc ôn tập tràn lan thông thường.

### 3.4 Luyện Bài Đọc Song Ngữ (Bilingual Article Practice)
* Tích hợp trọn bộ 4 tập giáo trình kinh điển **New Concept English (NCE 1–4)**.
* Luyện gõ từng câu đồng bộ với âm thanh giọng đọc bản ngữ.
* Hỗ trợ gõ theo dõi hoặc nghe chính tả theo từng câu trong đoạn văn.

### 3.5 Hệ Thống Sổ Từ Thông Minh (Smart Word Books)
* **Sổ từ yêu thích (`wordCollect`)**: Đánh dấu các từ vựng hay hoặc khó để ôn tập chuyên đề.
* **Sổ từ sai (`wordWrong`)**: Tự động lưu vết các từ người học gõ sai trong quá trình luyện tập để nhắc học lại.
* **Sổ từ đã thuộc (`wordKnown`)**: Đánh dấu các từ đã thành thạo; hệ thống sẽ **tự động loại trừ** những từ này khỏi các bài luyện tập tiếp theo nhằm tối đa hóa hiệu suất thời gian.

---

## 4. Hệ Thống Kho Học Liệu (Built-in Catalog)

Dự án sở hữu kho từ điển tích hợp cục bộ **194 bộ từ điển (277.529 từ vựng)** chia làm 4 phân nhóm chính:

```
public/list/word.json (194 bộ từ điển)
├── Luyện thi quốc tế (41 bộ, 108.008 từ)
│   └── IELTS Core, TOEFL Core, GRE 3000, GMAT, SAT, PTE ApeUni, TOEIC, Duolingo B1-C1...
├── Luyện thi Trung Quốc (45 bộ, 125.574 từ)
│   └── CET-4, CET-6, Cao học (KaoYan), Chuyên ngành Anh cấp 4/8 (TEM-4/8), PETS...
├── Tiếng Anh cho học sinh (106 bộ, 36.681 từ)
│   └── New Concept English 1-4, Thi vào 10, Thi ĐH 3500 từ, SGK tiếng Anh các cấp...
└── Luyện tập lập trình (2 bộ, 3.365 từ)
    └── Coder Words (Thuật ngữ Lập trình viên), Computer English (Từ vựng Khoa học Máy tính)
```

---

## 5. Trải Nghiệm Người Học Việt Nam (Vietnamese Learner UX)

* **Tương thích hoàn hảo bộ gõ tiếng Việt**: Engine gõ phím được tối ưu hóa đặc biệt để người dùng không cần phải tắt Unikey/EVKey hay chuyển sang chế độ gõ tiếng Anh khi học.
* **Giải nghĩa thuần Việt, tự nhiên**: Các định nghĩa từ ngữ cảnh được biên soạn và chuẩn hóa sang tiếng Việt phổ thông, giải thích rõ ngữ pháp và từ loại.
* **Bảo toàn học liệu gốc**: 100% từ tiếng Anh, phiên âm IPA, câu ví dụ và liên kết âm thanh bản ngữ được giữ nguyên vẹn.
