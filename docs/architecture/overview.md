# TypeWords — Tổng Quan Kiến Trúc (Architecture Overview)

Tài liệu này mô tả chi tiết kiến trúc kỹ thuật của **TypeWords (Bản Fork Việt Hóa)**, được thiết kế theo mô hình **Modular Monolith** kết hợp phân tách hoàn toàn tầng **Kỹ nghệ Dữ liệu (Data Engineering)** khỏi ứng dụng runtime.

---

## 1. Sơ Đồ Kiến Trúc Hệ Thống (System Architecture)

```text
┌────────────────────────────────────────────────────────────────────────┐
│                          TRÌNH DUYỆT NGƯỜI DÙNG                       │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    GIAO DIỆN & TYPING ENGINE (UI)                │  │
│  │  • Nuxt 4 / Vue 3 (Composition API)  • UnoCSS (Atomic Styles)    │  │
│  │  • Base Primitives (app/base/)       • Feature Components        │  │
│  │  • IME Handler (Unikey/EVKey OK)     • Web Audio Effects         │  │
│  └──────────────────┬─────────────────────────────▲─────────────────┘  │
│                     │                             │                    │
│                     ▼ (Use Cases / Actions)       │ (Reactive State)   │
│  ┌────────────────────────────────────────────────┴─────────────────┐  │
│  │                    APPLICATION USE CASES & STORES                │  │
│  │  • Composables: useTypingPractice, useLearningReview             │  │
│  │  • Pinia Stores: Chỉ lưu trạng thái UI (tab, modal, active id)   │  │
│  └──────────────────┬─────────────────────────────▲─────────────────┘  │
│                     │                             │                    │
│                     ▼ (Domain Calls)              │ (Domain Entities)  │
│  ┌────────────────────────────────────────────────┴─────────────────┐  │
│  │                    CORE DOMAIN SERVICES (app/core/)              │  │
│  │  • TypingEngine: State machine bàn gõ, đo WPM, phân loại lỗi    │  │
│  │  • FsrsScheduler: Thuật toán lặp lại ngắt quãng (FSRS v5)        │  │
│  │  • LegacyWordAdapter: Adapter chuyển đổi schema tương thích ngược│  │
│  └──────────────────┬─────────────────────────────▲─────────────────┘  │
│                     │                             │                    │
│                     ▼ (Repository Interface)      │ (Data Mapping)     │
│  ┌────────────────────────────────────────────────┴─────────────────┐  │
│  │                    PERSISTENCE & REPOSITORIES                    │  │
│  │  • IVocabularyRepository, IProgressRepository, IBookRepository │  │
│  │  • Infrastructure: IndexedDB (idb-keyval wrapper)               │  │
│  │  • Versioned Migrations Engine (__schema_version tracking)       │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼ (HTTP GET Static JSON Only)
┌────────────────────────────────────────────────────────────────────────┐
│                        TÀI NGUYÊN TĨNH RUNTIME (public/)               │
│  • public/list/word.json (Catalog 194 bộ từ điển tĩnh)                 │
│  • public/dicts/en/word/*.json (277.529 từ vựng song ngữ)              │
│  • public/dicts/en/article/*.json (Trọn bộ New Concept English 1-4)    │
└───────────────────────────────────▲────────────────────────────────────┘
                                    │ (pnpm data:publish qua Staging)
┌───────────────────────────────────┴────────────────────────────────────┐
│                  TẦNG KỸ NGHỆ DỮ LIỆU ĐỘC LẬP (data/ & scripts/)        │
│  • data/sources/       : Nguồn raw upstream / catalog metadata        │
│  • data/normalized/    : Dữ liệu chuẩn hóa schema canonical            │
│  • data/localized/     : Dữ liệu dịch nghĩa tiếng Việt ngữ cảnh        │
│  • data/translation-memory/ : Glossary thuật ngữ + Approved Memory     │
│  • data/schemas/       : JSON Schema / TypeBox definitions             │
│  • scripts/vocabulary/ : 01-discover → 02-fetch → 03-normalize →       │
│                          04-translate → 05-validate (QG) → 06-publish  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Nguyên Tắc Phân Tách Trách Nhiệm (Separation of Concerns)

1. **Application $\neq$ Data Engineering**:
   - Ứng dụng Nuxt chỉ đọc các tệp tĩnh đã được xuất bản trong `public/`.
   - Không có code xử lý tải dữ liệu hay dịch thuật chạy trong runtime của người dùng.
2. **UI $\neq$ Domain Logic**:
   - Component Vue không trực tiếp tính toán FSRS hay gọi cơ sở dữ liệu.
   - Toàn bộ nghiệp vụ được ủy thác cho Composable và Domain Service thuần túy.
3. **Pinia $\neq$ Database Layer**:
   - Pinia store chỉ giữ trạng thái hiển thị phản ứng (reactive state), không chứa câu lệnh truy vấn lưu trữ trực tiếp. Mọi thao tác ghi/đọc lưu trữ đều đi qua Repository.
4. **Locale-Neutral Persistence**:
   - Định danh sổ từ hệ thống luôn là chuỗi bất biến: `wordCollect`, `wordWrong`, `wordKnown`, `articleCollect`.
   - Tầng hiển thị sử dụng `$t('books.' + id)` để chuyển đổi linh hoạt giữa Tiếng Việt và Tiếng Anh.
