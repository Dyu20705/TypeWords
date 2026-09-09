# Type Words — Kiến Trúc Kỹ Thuật (Architecture Documentation)

Tài liệu này mô tả chi tiết kiến trúc phần mềm, cấu trúc thư mục, luồng dữ liệu, cơ chế lưu trữ cục bộ và các giải pháp kỹ thuật đặc thù trong **Type Words**.

---

## 1. Tổng Quan Kiến Trúc Hệ Thống (System Overview)

Type Words được xây dựng theo kiến trúc **Local-First Single Page Application (SPA / SSG)**, tối ưu hóa cho hiệu năng client-side cực cao, hoạt động mượt mà khi không có mạng và bảo vệ tuyệt đối dữ liệu cá nhân của người học.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          TRÌNH DUYỆT NGƯỜI DÙNG                       │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                     GIAO DIỆN & TYPING ENGINE                    │  │
│  │  • Nuxt 4 / Vue 3 (Composition API)  • UnoCSS                     │  │
│  │  • Typing Input & IME Handler        • Web Audio Sound Effects   │  │
│  └──────────────────┬─────────────────────────────▲─────────────────┘  │
│                     │                             │                    │
│                     ▼ (Mutations / Actions)       │ (Reactive State)   │
│  ┌────────────────────────────────────────────────┴─────────────────┐  │
│  │                   QUẢN LÝ TRẠNG THÁI (PINIA STORES)              │  │
│  │  • useBaseStore (Từ điển & Sổ từ)    • useSettingStore           │  │
│  │  • useWordStore (Tiến độ gõ từ)      • useArticleStore           │  │
│  └──────────────────┬─────────────────────────────▲─────────────────┘  │
│                     │                             │                    │
│                     ▼ (Persist / Hydrate)         │ (Query / Load)     │
│  ┌──────────────────┴─────────────────────────────┴─────────────────┐  │
│  │                   LƯU TRỮ CỤC BỘ (INDEXEDDB)                     │  │
│  │  • Thư viện idb-keyval                                          │  │
│  │  • Locale-Neutral Database Identity (wordCollect, wordWrong...) │  │
│  │  • FSRS Scheduler State & Lịch sử học tập                       │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼ (HTTP GET Static JSON)
┌────────────────────────────────────────────────────────────────────────┐
│                        NGUỒN DỮ LIỆU TĨNH (LOCAL ASSETS)               │
│  • public/list/word.json (Danh mục 194 bộ từ điển)                    │
│  • public/dicts/en/word/*.json (277.529 từ vựng song ngữ)             │
│  • public/dicts/en/article/*.json (Trọn bộ New Concept English 1-4)    │
└────────────────────────────────────────────────────────────────────────┘
```

### Công nghệ nền tảng
* **Framework**: [Nuxt 4](https://nuxt.com/) (Vue 3 + Composition API + `<script setup lang="ts">`).
* **Build Engine**: [Vite](https://vitejs.dev/) & [Nitro](https://nitro.unjs.io/).
* **Styling**: [UnoCSS](https://unocss.dev/) (Atomic CSS) + SCSS.
* **State Management**: [Pinia](https://pinia.vuejs.org/).
* **Local Storage**: [idb-keyval](https://github.com/jakearchibald/idb-keyval) (IndexedDB wrapper siêu nhẹ).
* **Internationalization**: `@nuxtjs/i18n` (Chuẩn hóa `vi` làm ngôn ngữ mặc định và `en`).

---

## 2. Cấu Trúc Mã Nguồn (Codebase Anatomy)

```
TypeWords/
├── app/                             # Mã nguồn ứng dụng Nuxt 4
│   ├── components/                  # Các Vue Components dùng chung
│   │   ├── dict/                    # Component chọn và quản lý từ điển
│   │   ├── setting/                 # Modal và bảng cấu hình người dùng
│   │   └── common/                  # Nút bấm, modal, input, dropdown
│   ├── composables/                 # Composables tái sử dụng logic
│   ├── core/                        # Nhân logic cốt lõi
│   │   ├── service/                 # Tương tác IndexedDB (db.ts, sync.ts)
│   │   ├── types/                   # Định nghĩa TypeScript (types.ts)
│   │   └── utils/                   # Hàm tiện ích xử lý từ, mảng, audio
│   ├── layouts/                     # Layout giao diện chính
│   ├── pages/                       # Hệ thống điều hướng router
│   │   ├── index.vue                # Trang chủ điều hướng
│   │   ├── (words)/                 # Luồng luyện từ vựng (words.vue, dict-list.vue)
│   │   └── (articles)/              # Luồng luyện bài đọc (articles.vue)
│   └── stores/                      # Pinia Stores quản lý dữ liệu toàn cục
├── data/                            # Tầng kỹ nghệ dữ liệu (Data Engineering)
│   ├── schemas/                     # JSON Schemas (VocabularyEntry, Catalog, Accounting)
│   ├── sources/                     # Metadata catalog & nguồn từ điển thô
│   ├── translation-memory/          # Glossary thuật ngữ & bộ nhớ dịch đã duyệt
│   └── manifests/                   # Bảng cân đối nguồn, báo cáo chất lượng & SHA-256
├── docs/                            # Tài liệu kỹ thuật dự án
│   ├── ARCHITECTURE.md              # Tài liệu kiến trúc
│   ├── PRODUCT.md                   # Tài liệu sản phẩm
│   ├── DEVELOPMENT.md               # Hướng dẫn phát triển & kiểm thử
│   ├── OPERATIONS.md                # Hướng dẫn vận hành & pipeline
│   ├── REFERENCE.md                 # Đặc tả dữ liệu & schema
│   ├── CHEATSHEET.md                # Bảng phím tắt & cẩm nang
│   └── README.vi.md                 # Tài liệu tổng quan tiếng Việt
├── i18n/                            # Ngữ liệu đa ngôn ngữ
│   └── locales/
│       ├── vi.json                  # Ngữ liệu Tiếng Việt (1.091 khóa)
│       └── en.json                  # Ngữ liệu Tiếng Anh (1.091 khóa)
├── public/                          # Tài nguyên tĩnh phục vụ trực tiếp
│   ├── dicts/en/word/*.json         # 194 bộ từ điển (277.529 từ)
│   ├── dicts/en/article/*.json      # 4 tập New Concept English
│   └── list/                        # Danh mục từ điển và bài đọc
├── scripts/                         # Bộ kịch bản tự động hóa & kiểm thử
│   ├── lint-i18n.ts                 # Kiểm tra đối xứng i18n
│   ├── test-db-migration.ts         # Kiểm thử di trú IndexedDB
│   ├── check-hardcoded-zh.ts        # Quét và ngăn chặn chuỗi tiếng Trung
│   ├── data/                        # Đường ống dữ liệu canonical (01-discover -> 06-publish)
│   └── vocabulary/                  # Bộ nhớ đệm dịch thuật & công cụ phụ trợ
└── README.md                        # Tài liệu tổng quan gốc
```

### 2.1 Phân định Ranh giới Dữ liệu (Data & Runtime Boundary)
Hệ thống phân lập rõ ràng giữa hai tầng:
1. **Tầng Kỹ nghệ Dữ liệu (`data/` & `scripts/data/`)**: Vận hành độc lập để xử lý nguồn thô, chuẩn hóa canonical `VocabularyEntry`, thực thi dịch thuật kiểm soát qua TM/Glossary, và kiểm định qua 3 tầng Quality Gates.
2. **Tầng Ứng dụng Runtime (`app/`)**: Giao diện người dùng Nuxt 4, quản lý trạng thái Pinia và lưu trữ IndexedDB.
3. **Lớp chuyển tiếp tương thích (`LegacyWordAdapter`)**: Đặt tại `app/core/vocabulary/adapter/legacy-word-adapter.ts`, đảm nhiệm chuyển đổi hai chiều giữa canonical `VocabularyEntry` và định dạng `Word` runtime hiện hành.

---

## 3. Cơ Chế Lưu Trữ Client-Side & Quy Chuẩn IndexedDB

### 3.1 Định danh Bất biến (Locale-Neutral Database Identity)
Một trong những cải tiến kiến trúc cốt lõi của bản fork là **tách rời hoàn toàn định danh dữ liệu khỏi ngôn ngữ giao diện**:
* **Vấn đề của bản gốc**: Upstream dùng chuỗi tiếng Trung (`'收藏'`, `'错词'`, `'已掌握'`) làm ID khóa trong cơ sở dữ liệu. Khi đổi sang tiếng Anh hoặc tiếng Việt, hệ thống bị trùng lặp hoặc mất liên kết dữ liệu cũ.
* **Giải pháp chuẩn hóa**: Định danh chuẩn trong IndexedDB luôn là các hằng số độc lập ngôn ngữ:
  - Sổ từ yêu thích: `wordCollect`
  - Sổ từ sai: `wordWrong`
  - Sổ từ đã thuộc: `wordKnown`
  - Sổ bài đọc yêu thích: `articleCollect`
* **Hiển thị linh hoạt**: Tại tầng hiển thị (Presentation Layer), tên sổ từ được giải quyết động qua hàm `$t('books.' + id)`. Bản ghi lưu trữ có `name: ''` hoặc ID chuẩn, giúp người dùng chuyển đổi qua lại giữa `vi` và `en` mà cơ sở dữ liệu vẫn nhất quán tuyệt đối.

### 3.2 Di Trú Dữ Liệu An Toàn & Bất Biến (Idempotent Migration)
Hàm `normalizeLegacySystemBook()` và `checkAndUpgradeSaveDict()` trong `app/core/service/db.ts` tự động phát hiện các bản ghi cũ mang tên tiếng Trung hoặc tiếng Anh của upstream và quy đổi về ID chuẩn mà không làm mất:
1. Ghi chú cá nhân (`notes`).
2. Trạng thái và tham số của thuật toán lặp lại ngắt quãng FSRS.
3. Toàn bộ các sổ từ tự tạo (custom books) của người dùng.

---

## 4. Typing Engine & Xử Lý Bộ Gõ Tiếng Việt (IME Support)

### 4.1 Cơ chế bắt sự kiện phím
Typing Engine lắng nghe trực tiếp sự kiện `keydown` trên vùng cửa sổ học tập để tạo độ trễ gần như bằng 0 (zero latency):
* Nhận diện các phím điều khiển đặc biệt (`Ctrl`, `Alt`, `Shift`, `Tab`, `Escape`, `Enter`).
* Kiểm tra ký tự nhập vào đối chiếu với chữ cái mục tiêu tại vị trí con trỏ hiện tại (`activeWord[cursorIndex]`).

### 4.2 Tối ưu hóa Bộ gõ tiếng Việt (Unikey / EVKey / OpenKey)
* **Vấn đề**: Các bộ gõ tiếng Việt dựa trên cơ chế gửi phím ảo (virtual backspace) để ghép dấu (Telex/VNI). Trên bản gốc, điều này kích hoạt cảnh báo gây gián đoạn: `请切换到英文输入` (Vui lòng chuyển sang gõ tiếng Anh).
* **Giải pháp**:
  - Loại bỏ hoàn toàn cảnh báo ép buộc gõ tiếng Anh.
  - Typing Engine chỉ lắng nghe mã phím chuẩn ký tự ASCII chữ cái và xử lý thông minh trạng thái con trỏ, cho phép người dùng thoải mái gõ ngay cả khi đang bật Unikey/EVKey.

---

## 5. Hệ Thống Âm Thanh & Phát Âm (Audio Pipeline)

### 5.1 Âm thanh phát âm từ vựng
* Phát âm từ vựng được sinh động dựa trên API âm thanh chất lượng cao:
  - Giọng Mỹ (US): `https://dict.youdao.com/dictvoice?audio={word}&type=2`
  - Giọng Anh (UK): `https://dict.youdao.com/dictvoice?audio={word}&type=1`
* Hỗ trợ lưu đệm audio (caching) trong bộ nhớ phiên làm việc để hạn chế tải lại nhiều lần.

### 5.2 Hiệu ứng âm thanh bàn phím (Mechanical Keyboard Effects)
* Tích hợp Web Audio API phát trực tiếp âm thanh phím cơ mượt mà (Cherry MX Blue, Red, Brown, Máy đánh chữ cổ điển, v.v.) mà không làm giảm FPS của trang web.

---

## 6. Hệ Thống Bản Địa Hóa (i18n Subsystem)

* **Tối giản hóa Locale**: Hệ thống tập trung tối đa vào 2 ngôn ngữ: `vi` (Tiếng Việt - mặc định) và `en` (Tiếng Anh). Toàn bộ 12 locale phụ không được duy trì từ bản gốc đã được gỡ bỏ để giảm nhẹ kích thước bundle.
* **Đảm bảo không rò rỉ ký tự Trung Quốc**: Bộ kiểm tra tự động `scripts/check-hardcoded-zh.ts` quét qua toàn bộ hơn 200 tệp giao diện đảm bảo 100% không còn chuỗi tiếng Trung sót lại trong mã nguồn người dùng.
* **Loại bỏ dịch vụ bên thứ ba nội địa**: Loại bỏ hoàn toàn script theo dõi Baidu Analytics (`hm.baidu.com`), máy chủ thống kê upstream (`libs.typewords.cc`), mã QR WeChat/QQ và số giấy phép ICP.
