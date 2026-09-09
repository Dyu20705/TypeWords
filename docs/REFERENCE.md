# Type Words — Đặc Tả Dữ Liệu & Tra Cứu Kỹ Thuật (Technical Reference)

Tài liệu này cung cấp đặc tả kỹ thuật chi tiết về cấu trúc dữ liệu JSON của các bộ từ điển, danh mục bài đọc, định dạng lưu trữ trong IndexedDB và bảng quy chuẩn từ loại.

---

## 1. Đặc Tả Dữ Liệu Danh Mục (Catalog Schema)

Tệp danh mục lưu trữ tại `public/list/word.json` và `public/list/recommend_word.json`. Mỗi mục trong danh mục là một đối tượng `WordBook` với cấu trúc:

```typescript
export interface WordBook {
  id: string                    // Mã định danh duy nhất (ví dụ: "IELTS_3_T")
  name: string                  // Tên hiển thị tiếng Việt (ví dụ: "IELTS Cốt Lõi")
  description: string           // Mô tả ngắn gọn về bộ từ điển
  category: string              // Chuyên mục lớn ("Luyện thi quốc tế", "Luyện thi Trung Quốc", ...)
  tags: string[]                // Mảng các nhãn thẻ phân loại (ví dụ: ["IELTS", "Du học"])
  url: string                   // Tên tệp tương đối trong public/dicts/en/word/ (ví dụ: "IELTS_3_T.json")
  length: number                // Tổng số lượng từ vựng trong bộ
  language: 'en'                // Ngôn ngữ từ vựng nguồn (luôn là "en")
  translateLanguage: 'vi'       // Ngôn ngữ giải nghĩa đích ("vi")
}
```

---

## 2. Đặc Tả Dữ Liệu Từ Vựng (Vocabulary Entry Schema)

Mỗi tệp từ điển trong `public/dicts/en/word/*.json` là một mảng chứa các đối tượng `Word` với cấu trúc đầy đủ:

```typescript
export interface Word {
  word: string                  // Từ vựng tiếng Anh (bảo toàn 100%)
  phonetic?: string             // Phiên âm quốc tế IPA (ví dụ: "/əˈbaʊt/")
  sound?: string                // Tên tệp âm thanh bổ sung (nếu có)
  trans: WordTranslation[]      // Danh sách định nghĩa theo từng từ loại
  sentences?: WordSubContent[]  // Danh sách câu ví dụ ngữ cảnh song ngữ
  phrases?: WordSubContent[]    // Các cụm từ hoặc thành ngữ liên quan
  synos?: WordSynonym[]         // Các nhóm từ đồng nghĩa
  relWords?: WordRelWords       // Từ cùng gốc và họ từ
  etymology?: WordEtymology     // Nguồn gốc và lịch sử hình thành từ
}

export interface WordTranslation {
  pos: string                   // Từ loại (ví dụ: "n.", "v.", "adj.")
  cn: string                    // Nghĩa tiếng Việt (trường hiển thị trên UI)
  cn_source?: string            // Nghĩa gốc tiếng Trung (lưu vết phục vụ kiểm toán)
}

export interface WordSubContent {
  c: string                     // Nội dung tiếng Anh (câu hoặc cụm từ ví dụ)
  cn: string                    // Bản dịch tiếng Việt tương ứng
  cn_source?: string            // Bản dịch gốc tiếng Trung
}

export interface WordSynonym {
  pos: string                   // Từ loại của nhóm từ đồng nghĩa
  ws: string[]                  // Danh sách các từ tiếng Anh đồng nghĩa
  cn: string                    // Giải nghĩa tiếng Việt của nhóm
  cn_source?: string            // Giải nghĩa gốc tiếng Trung
}

export interface WordRelWords {
  root: string                  // Gốc từ tiếng Anh
  words: Array<{
    pos: string                 // Từ loại
    word: string                // Từ phát sinh
    cn: string                  // Nghĩa tiếng Việt
    cn_source?: string          // Nghĩa gốc tiếng Trung
  }>
}

export interface WordEtymology {
  t: string                     // Loại từ nguyên
  d: string                     // Chi tiết giải thích từ nguyên (tiếng Việt)
  t_source?: string             // Loại từ nguyên gốc tiếng Trung
  d_source?: string             // Giải thích gốc tiếng Trung
}
```

### Ví dụ bản ghi từ vựng thực tế (`public/dicts/en/word/it-words.json`)
```json
{
  "word": "algorithm",
  "phonetic": "/ˈælɡərɪðəm/",
  "trans": [
    {
      "pos": "n.",
      "cn": "[tin học] thuật toán, giải thuật",
      "cn_source": "[计] 算法"
    }
  ],
  "sentences": [
    {
      "c": "A search algorithm finds information stored within some data structure.",
      "cn": "Một thuật toán tìm kiếm sẽ tìm thông tin được lưu trữ trong một cấu trúc dữ liệu nào đó.",
      "cn_source": "搜索算法查找存储在某些数据结构中的信息。"
    }
  ],
  "phrases": [
    {
      "c": "genetic algorithm",
      "cn": "thuật toán di truyền",
      "cn_source": "遗传算法"
    }
  ]
}
```

---

## 3. Đặc Tả Dữ Liệu Bài Đọc (Article Schema)

Tệp bài đọc lưu trữ tại `public/dicts/en/article/*.json` (ví dụ: `nce-new-1.json`):

```typescript
export interface ArticleBook {
  id: string                    // Mã định danh (ví dụ: "nce-new-1")
  name: string                  // Tên giáo trình ("New Concept English 1")
  articles: Article[]           // Danh sách các bài học / bài văn
}

export interface Article {
  id: string                    // Mã bài đọc (ví dụ: "lesson-01")
  title: string                 // Tiêu đề bài đọc
  audio: string                 // Đường dẫn tệp âm thanh bài đọc
  sentences: ArticleSentence[]  // Mảng các câu trong bài đọc
}

export interface ArticleSentence {
  c: string                     // Câu tiếng Anh
  cn: string                    // Bản dịch câu tiếng Việt
  time: number                  // Thời điểm bắt đầu đọc trong file audio (ms)
}
```

---

## 4. Đặc Tả Lưu Trữ Cục Bộ (IndexedDB Storage Specs)

Ứng dụng sử dụng cơ chế lưu trữ khóa - giá trị của `idb-keyval` trên trình duyệt:

| Khóa (Key) | Kiểu dữ liệu | Ý nghĩa chức năng |
|---|---|---|
| `DICT_KEY` | `WordBook & { words: Word[] }` | Dữ liệu đầy đủ của bộ từ điển người dùng đang mở luyện tập |
| `SETTING_KEY` | `UserSetting` | Cấu hình âm lượng, âm thanh bàn phím, kích thước chữ, theme |
| `HISTORY_KEY` | `TypingHistory[]` | Lịch sử gõ phím, tốc độ WPM, độ chính xác (Accuracy) theo ngày |
| `wordCollect` | `SystemWordBook` | Danh sách từ vựng thuộc sổ **Yêu thích** |
| `wordWrong` | `SystemWordBook` | Danh sách từ vựng thuộc sổ **Từ sai** |
| `wordKnown` | `SystemWordBook` | Danh sách từ vựng thuộc sổ **Đã thuộc** (tự động bỏ qua) |
| `articleCollect`| `SystemArticleBook` | Danh sách các bài đọc trong sổ **Bài đọc yêu thích** |

### Cấu trúc thông số thuật toán FSRS lưu trong từng từ
```typescript
export interface WordFSRSState {
  due: string                   // Thời điểm cần ôn tập tiếp theo (chuỗi ISO Date)
  stability: number             // Độ bền trí nhớ (tính theo ngày)
  difficulty: number            // Độ khó của từ (thang điểm 1 - 10)
  reps: number                  // Số lượt đã ôn tập thành công
  lapses: number                // Số lần người học đánh giá quên hoặc gõ sai
  state: 0 | 1 | 2 | 3          // 0: Mới, 1: Đang học, 2: Ôn tập, 3: Học lại
}
```

---

## 5. Bảng Quy Chuẩn Viết Tắt Từ Loại (Parts of Speech Glossary)

Bảng đối chiếu viết tắt các từ loại ngữ pháp thường gặp trong hệ thống từ điển Type Words:

| Ký hiệu | Tên tiếng Anh | Tên tiếng Việt | Ví dụ |
|---|---|---|---|
| `n.` | Noun | Danh từ | *book, apple, computer* |
| `v.` | Verb | Động từ | *run, write, compile* |
| `vt.` | Transitive Verb | Ngoại động từ (cần tân ngữ) | *build, create, execute* |
| `vi.` | Intransitive Verb | Nội động từ (không cần tân ngữ) | *exist, happen, sleep* |
| `adj.` | Adjective | Tính từ | *fast, smart, efficient* |
| `adv.` | Adverb | Trạng từ / Phó từ | *quickly, accurately, well* |
| `prep.` | Preposition | Giới từ | *in, on, at, through* |
| `conj.` | Conjunction | Liên từ | *and, but, because, although* |
| `pron.` | Pronoun | Đại từ | *it, they, someone, which* |
| `num.` | Numeral | Số từ | *first, second, one, hundred* |
| `art.` | Article | Mạo từ | *a, an, the* |
| `int.` / `interj.` | Interjection | Thán từ | *oh, wow, oops* |
| `phrase` | Idiomatic Phrase | Cụm từ / Thành ngữ | *in terms of, as well as* |
