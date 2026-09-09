# TypeWords — Mô Hình Dữ Liệu & Khế Ước Kỹ Thuật (Data Model & Contracts)

Tài liệu này đặc tả toàn diện mô hình dữ liệu, khế ước giao tiếp giữa các tầng và cơ chế chuyển đổi tương thích ngược trong **TypeWords**.

---

## 1. Khế Ước Từ Vựng Chuẩn Hóa (Canonical `VocabularyEntry`)

Khế ước chuẩn hóa phân tách rõ:
$$\text{Word Identity} \neq \text{Display Language} \neq \text{Translation} \neq \text{Source}$$

```typescript
export interface VocabularyMeaning {
  pos: string                     // Từ loại chuẩn: "n.", "v.", "adj.", "adv."
  vi: string                      // Nghĩa tiếng Việt chuẩn ngữ cảnh
  en?: string                     // Định nghĩa tiếng Anh
  zh?: string                     // Nghĩa tiếng Trung gốc đối chiếu
  context?: string                // Ngữ cảnh chuyên ngành (CNTT, kinh tế...)
}

export interface VocabularyExample {
  en: string                      // Câu tiếng Anh gốc
  vi?: string                     // Dịch nghĩa tiếng Việt
  zh?: string                     // Dịch nghĩa tiếng Trung
}

export interface VocabularyPhrase {
  phrase: string                  // Cụm từ tiếng Anh
  vi?: string                     // Nghĩa tiếng Việt
  zh?: string                     // Nghĩa tiếng Trung
}

export interface VocabularyEntry {
  id: string                      // Bắt buộc: Định danh duy nhất
  word: string                    // Bắt buộc: Từ tiếng Anh gốc
  normalizedWord: string          // Bắt buộc: Từ viết thường, bỏ khoảng trắng
  definitions: VocabularyMeaning[]// Bắt buộc: Danh sách các lớp nghĩa
  phonetic?: {                    // Tùy chọn: Phiên âm IPA
    uk?: string
    us?: string
  }
  examples?: VocabularyExample[]  // Tùy chọn: Câu ví dụ
  phrases?: VocabularyPhrase[]    // Tùy chọn: Cụm từ liên quan
  synonyms?: {                    // Tùy chọn: Từ đồng nghĩa
    pos: string
    words: string[]
    vi?: string
  }[]
  metadata?: {                    // Tùy chọn: Thông tin xuất xứ
    source?: string
    level?: string                // CEFR: A1, A2, B1, B2, C1, C2
    tags?: string[]
    frequency?: number
  }
}
```

---

## 2. Khế Ước Bộ Chuyển Đổi Tương Thích Tạm Thời (Transitional `LegacyWordAdapter`)

Để duy trì khả năng hiển thị của các component giao diện hiện hành mà không cần rewrite:

```typescript
export function adaptVocabularyEntryToLegacyWord(entry: VocabularyEntry): any {
  return {
    id: entry.id,
    word: entry.word,
    phonetic0: entry.phonetic?.uk || '',
    phonetic1: entry.phonetic?.us || '',
    trans: entry.definitions.map(d => ({
      pos: d.pos,
      cn: d.vi,                    // Tạm thời truyền nghĩa tiếng Việt vào trường cn
      cn_source: d.zh || '',      // Giữ nguyên chuỗi tiếng Trung gốc
    })),
    sentences: (entry.examples || []).map(e => ({
      c: e.en,
      cn: e.vi || '',
      cn_source: e.zh || '',
    })),
    phrases: (entry.phrases || []).map(p => ({
      c: p.phrase,
      cn: p.vi || '',
    })),
  }
}
```

> **Lưu ý Kiến trúc**: Adapter này được quản lý qua `ADR-002`. Nó chỉ là giải pháp quá độ (transitional layer) trong lúc refactor tầng ứng dụng, không phải là kiến trúc vĩnh cửu.

---

## 3. Khế Ước Lưu Trữ Người Dùng (User Persistence Model)

### 3.1 Định Danh Sổ Từ Hệ Thống (System Book IDs)
Khóa bất biến trong IndexedDB:
* `wordCollect`: Sổ từ yêu thích (Hiển thị: `$t('books.wordCollect')`)
* `wordWrong`: Sổ từ hay gõ sai (Hiển thị: `$t('books.wordWrong')`)
* `wordKnown`: Sổ từ đã thành thạo (Hiển thị: `$t('books.wordKnown')`)
* `articleCollect`: Sổ bài đọc yêu thích (Hiển thị: `$t('books.articleCollect')`)

### 3.2 Tiến Độ Học Tập & Thẻ FSRS (Learning Progress Entity)
```typescript
export interface UserWordProgress {
  word: string                    // Khóa định danh từ
  bookId: string                  // ID sổ từ đang học
  state: number                   // FSRS State: 0 (New), 1 (Learning), 2 (Review), 3 (Relearning)
  due: string                     // Thời điểm ôn tập tiếp theo (ISO 8601)
  stability: number               // Độ bền trí nhớ (S)
  difficulty: number              // Độ khó của từ (D)
  elapsed_days: number            // Số ngày kể từ lần ôn gần nhất
  scheduled_days: number          // Số ngày đã lên lịch
  reps: number                    // Số lần đã ôn tập thành công
  lapses: number                  // Số lần quên/gõ sai
  last_review?: string            // Thời điểm ôn tập gần nhất
  notes?: string                  // Ghi chú cá nhân của người dùng
}
```
