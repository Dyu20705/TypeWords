# TypeWords — Architecture Baseline & Technical Debt Snapshot (Phase 0 Audit)

> **Thời điểm lập**: 2026-09-09  
> **Repository**: `Dyu20705/TypeWords`  
> **Branch**: `feat/vi-en-localization`  
> **Snapshot Commit**: `6aafa03a012333a070f0234fb6dce99347202931`  
> **Upstream Reference**: `zyronon/TypeWords@master` (base `633e179c1197c84325ad92fb983d3435dfe4b37a`)

---

## 1. Bản Đồ Kiến Trúc Hiện Tại (As-Is Architecture Map)

```text
┌─────────────────────────────────────────────────────────────┐
│                 Giao Diện (Vue Components & Pages)           │
│    (Dict.vue, Words.vue, TypingArticle.vue, Setting.vue)    │
└──────────────────────────────┬──────────────────────────────┘
                               │ (Direct Coupling)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│              Quản Lý Trạng Thái (Pinia Stores)              │
│  useBaseStore.ts, useSettingStore.ts, usePracticeStore.ts   │
│  - Lưu trữ reactive state giao diện                        │
│  - Chứa thuật toán FSRS Card state                          │
│  - Gọi trực tiếp idb-keyval (IndexedDB)                     │
│  - Xử lý migration và nâng cấp cấu trúc sổ từ               │
└──────────────────────────────┬──────────────────────────────┘
                               │ (Direct Database Calls)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Lưu Trữ Cục Bộ (IndexedDB)                  │
│                     Thư viện idb-keyval                     │
│  - Key SAVE_DICT_KEY: { word: {...}, article: {...} }       │
│  - Định danh đã chuẩn hóa: wordCollect, wordWrong, wordKnown│
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Các Điểm Nghẽn Kiến Trúc & Technical Debt Nhận Diện

### 2.1 Pinia đang gánh toàn bộ Business Logic & Storage Calls
Trong `app/core/stores/base.ts`:
* Import trực tiếp `import { get } from 'idb-keyval'`.
* Chứa hàm `checkAndUpgradeSaveDict()`, `_getStudyProgress()`, quản lý cấu trúc FSRS `Record<string, Card>`, quản lý `noteData`.
* **Hậu quả**: Không thể viết unit test độc lập cho logic nghiệp vụ mà không phải khởi tạo Pinia và mock IndexedDB toàn cục.

### 2.2 Thiếu Tầng Repository Trừu Tượng Hóa
Hiện tại, code đọc và ghi trực tiếp đối tượng khổng lồ `SaveData` vào khóa duy nhất `save_dict` của `idb-keyval`.
* **Hậu quả**: Nếu tương lai muốn chuyển đổi sang SQLite (Tauri/Electron), server sync (Supabase REST API), hoặc cấu trúc IndexedDB đa bảng (object stores), toàn bộ Pinia store và logic hiển thị sẽ phải viết lại.

### 2.3 "Junk Drawer" trong `app/core/utils/`
Tệp `app/core/utils/index.ts` có kích thước lên tới **25 KB** (hơn 800 dòng lệnh), chứa lẫn lộn:
* Xử lý âm thanh Web Audio (`playKeySound`, `playWordAudio`).
* Thuật toán so khớp chuỗi (`string-comparison`).
* Các hàm format ngày tháng, tính toán tiến độ.
* Hàm xử lý DOM, fullscreen, sao chép clipboard.

### 2.4 Data Pipeline bị hòa lẫn với Runtime App & Mã Nguồn
Thư mục `scripts/vocabulary/` hiện chứa:
* Script Python và TypeScript (`translate-zh-to-vi.py`, `localize-catalog.ts`...).
* Tệp cache dịch thuật khổng lồ: `.translation-cache.json` (**18.3 MB**).
* Các tệp báo cáo JSON: `validation-report.json`, `download-report.json`, `integrity-report.json`.
* Tệp catalog production: `production-catalog.json` (118 KB).
* Dữ liệu sau khi xử lý được ghi đè thẳng vào `public/dicts/en/word/*.json`.
* **Hậu quả**: Không có ranh giới rõ ràng giữa nguồn dữ liệu thô (raw source), dữ liệu chuẩn hóa (normalized), dữ liệu bản địa hóa (localized) và tài nguyên tĩnh xuất bản (published runtime).

---

## 3. Bản Đồ Ranh Giới Chuyển Đổi (Target Boundary Map)

```text
TypeWords/
├── app/                  # RUNTIME APPLICATION
│   ├── base/             # UI Primitives (Zero rewrite)
│   ├── components/       # Domain-grouped components
│   ├── composables/      # Application Use Cases
│   └── core/             # DOMAIN & PERSISTENCE
│       ├── vocabulary/   # Domain logic & Legacy Adapter
│       ├── learning/     # FSRS scheduling domain service
│       ├── typing/       # Typing Engine & IME stabilizer
│       └── persistence/  # Repository Interfaces & Migrations
│
├── data/                 # DATA ENGINEERING BOUNDARY
│   ├── schemas/          # VocabularyEntry JSON Schema
│   ├── manifests/        # Catalog inventories & checksums
│   ├── translation-memory/ # Glossary & Approved TM
│   ├── normalized/       # Canonical English headwords
│   └── localized/        # Validated bilingual datasets
│
├── public/               # RUNTIME PUBLISHED ASSETS ONLY
│   └── dicts/            # Published files from pipeline
│
└── tests/                # 4-TIER AUTOMATED TEST SUITE
```

---

## 4. Kết Luận Phase 0 Baseline

Mọi chỉ số hiện trạng đã được lập văn bản đầy đủ và lưu vết trong thư mục `docs/audit/`. Bước chuẩn bị Phase 0 đã hoàn tất xuất sắc, đảm bảo cơ sở dữ liệu đối chiếu vững chắc trước khi bước sang Phase 1.
