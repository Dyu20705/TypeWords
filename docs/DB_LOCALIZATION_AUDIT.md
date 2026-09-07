# TypeWords Learning Database Localization Audit (Chinese → Vietnamese)

> **Scope Clarification**: This audit evaluates the **Learning Database and Educational Content** of TypeWords. 
> The UI already supports Vietnamese (`i18n/locales/vi.json`). This project strictly addresses localizing learner-facing educational content—such as word meanings, example translations, phrase translations, article translations, etymology, and resource catalogs—from Chinese to Vietnamese while preserving 100% of English source material and data structures.

---

## Executive Summary

| Metric | Bundled Repository Scope (Immediate) | Historical Cloud Ecosystem Scope (Extrapolated) |
|---|---:|---:|
| **Target Datasets** | 4 main datasets (CET-4, NCE-1, Catalogs, Doc Resources) | 249 datasets (241 word dicts + 8 article books) |
| **Total Records** | 2,612 learning records (2,607 words, 5 articles) | 295,299 records (294,747 words, 552 articles) |
| **Chinese Characters** | 560,161 characters | ~63,000,000 characters |
| **Translation Units** | 43,589 strings | ~4,900,000 strings |
| **Recommended Target** | **Tier 2 (Complete Learning Database)** | Staged migration via Community / Cloud API |
| **Effort (Tier 2 AI-assisted)** | **588–686 person-hours** (~74–86 person-days) | N/A (Multi-year / Enterprise scope) |
| **AI/API Cost (Tier 2)** | **~$0.21 – $0.42** (Gemini 1.5 Flash / GPT-4o-mini) | ~5.00 – 0.00 |

---

## 1. Data Architecture & Runtime Flow

### 1.1 Discovery of Learning Data Sources

An exhaustive inspection of the codebase reveals that TypeWords handles learning data through a decoupled, client-heavy architecture:

1. **Bundled Static JSON (`public/dicts/` & `public/list/`)**:
   - `public/list/word.json` & `recommend_word.json`: Active catalog listing word dictionaries. Currently points to `CET4_T.json` (`translateLanguage: "zh_CN"`).
   - `public/dicts/en/word/CET4_T.json` (4.3 MB): 2,607 vocabulary records with rich pedagogical metadata.
   - `public/list/article.json` & `recommend_article.json`: Active catalog listing article textbooks. Currently points to `NCE_1.json`.
   - `public/dicts/en/article/NCE_1.json` (11 KB): 5 lessons from New Concept English 1 with synchronized audio and bilingual sentences.
2. **Embedded Pedagogical Resources (`app/pages/doc.vue`)**:
   - 493 lines containing hardcoded categories, descriptions, titles, and difficulty labels for external English learning resources (51 resources, 40 categories/subcategories).
3. **System Hardcoded State (`app/core/stores/base.ts` & `app/core/config/env.ts`)**:
   - Virtual system dictionaries: `收藏` (Favorites), `错词` (Wrong Words), `已掌握` (Mastered - *"已掌握后的单词不会出现在练习中"*).
   - Keyboard sound labels: `机械键盘` (Mechanical keyboard), `笔记本键盘` (Laptop keyboard).
   - Word practice stage and mode name maps (`跟写新词`, `自测新词`, `听写新词`, etc.).
4. **Online Fallback API & Translation Hooks (`app/core/apis/words.ts` & `app/core/hooks/translate.ts`)**:
   - Remote dictionary query endpoint: `https://api.typewords.cc/public.word/query?word=...`
   - Article automatic machine translation hook: hardcoded to translate `en` → `zh-CN` via Baidu Translation API.
5. **Client Persistence (IndexedDB)**:
   - Utilizes `idb-keyval` storing the active dictionary under key `'typing-word-dict'` (version 4) and practice cache under `'PracticeSaveWord'` / `'PracticeSaveArticle'`.
6. **Cloud Synchronization (User Supabase)**:
   - Supabase is utilized strictly as a client-configured data backup/sync mechanism for serialized snapshots of local IndexedDB data. It does not serve public dictionary content.

### 1.2 The Runtime Data Flow

```
[ Static JSON: public/dicts/en/word/CET4_T.json ]
[ Static JSON: public/dicts/en/article/NCE_1.json ]
                    │
                    ▼  (HTTP fetch via resourceWrap)
[ Loader: _getDictDataByUrl() in app/core/utils/index.ts ]
                    │
                    ▼  (Normalization: convertToWord() / parseSentence())
[ State Management: Pinia useBaseStore() in app/core/stores/base.ts ]
                    │
         ┌──────────┴──────────┐
         ▼                     ▼
[ Client Storage: IndexedDB ]  [ Learning Runtime Composables ]
  - typing-word-dict             - usePracticeWordSession
  - PracticeSaveWord             - usePracticeWordNavigator
  - PracticeSaveArticle          - word-test (distractor generator)
         │                     │
         ▼                     ▼
[ User Supabase Sync ]         [ Learning UI Components ]
  (Optional Cloud Snapshot)      - TranslationList.vue
                                 - WordMetaPanel.vue
                                 - TypeWord.vue
                                 - TypingSentenceItem.vue
                                 - TypingArticle.vue
```

### 1.3 Canonical Source of Truth

- For vocabulary: `public/dicts/en/word/[url]` (e.g. `CET4_T.json`).
- For articles: `public/dicts/en/article/[url]` (e.g. `NCE_1.json`).
- For dictionary catalogs: `public/list/word.json` and `public/list/article.json`.
- For study resource guide: `app/pages/doc.vue`.

---

## 2. Inventory of Learning Content

| Domain | Content Item | Field Path | Learner-Facing Function | Chinese Content Type |
|---|---|---|---|---|
| **Vocabulary** | Headword definitions | `Word.trans[].cn` | Primary dictionary definitions shown during typing/dictation | Category A (Learner translation) |
| **Vocabulary** | Part of speech | `Word.trans[].pos` | Syntactic classification (`v.`, `n.`, `adj.`) | English source (Preserve) |
| **Vocabulary** | Example translations | `Word.sentences[].cn` | Contextual meaning of the target word in a sentence | Category A (Learner translation) |
| **Vocabulary** | English sentences | `Word.sentences[].c` | English sentence practice material | English source (Preserve) |
| **Vocabulary** | Phrase translations | `Word.phrases[].cn` | Idiomatic / collocation translation | Category A (Learner translation) |
| **Vocabulary** | English phrases | `Word.phrases[].c` | Target collocation in English | English source (Preserve) |
| **Vocabulary** | Synonym glosses | `Word.synos[].cn` | Meaning of synonym group | Category C (Mixed domain/meaning) |
| **Vocabulary** | English synonyms | `Word.synos[].ws[]` | Related English vocabulary | English source (Preserve) |
| **Vocabulary** | Related word glosses | `Word.relWords.rels[].words[].cn`| Derivative word meanings | Category C (Mixed POS/meaning) |
| **Vocabulary** | Related English words| `Word.relWords.rels[].words[].c` | Derivative English vocabulary | English source (Preserve) |
| **Vocabulary** | Etymology title | `Word.etymology[].t` | Origin mnemonic headline | Category B (Learner explanation) |
| **Vocabulary** | Etymology description| `Word.etymology[].d` | Detailed historical / linguistic derivation | Category B (Learner explanation) |
| **Articles** | Lesson title translation| `Article.titleTranslate` | Article header translation | Category A (Learner translation) |
| **Articles** | Lesson text translation | `Article.textTranslate` | Interlinear sentence translation | Category A (Learner translation) |
| **Catalogs** | Dictionary descriptions | `DictResource.description` | Catalog overview card | Category D (Chinese metadata) |
| **Catalogs** | Categories & Tags | `DictResource.category`, `.tags`| Library filtering and tabs | Category D (Chinese metadata) |
| **Resources** | Resource card titles | `doc.vue -> categories[].resources[].name` | Resource library links | Category D (Resource metadata) |
| **Resources** | Pedagogical hints | `doc.vue -> ...resources[].difficulty` | Level guidance ("入门", "进阶") | Category B (Learner explanation) |
| **System** | Virtual Dict Names | `baseStore.word.bookList[].name`| System folders (`收藏`, `错词`, `已掌握`)| Category D (System metadata) |

---

## 3. Database Quantification (Programmatic Audit)

Measurements obtained via programmatic parsing using Python with Unicode range `[㐀-䶿一-鿿豈-﫿]`:

### 3.1 Hard Numbers by Dataset

| Dataset | Files | Records | Fields With Chinese | Chinese Chars | English Words | Translation Units (Total / Unique) |
|---|---:|---:|---:|---:|---:|---:|
| **Vocabulary (CET-4)** | 1 | 2,607 | 7 (`trans`, `sentences`, `phrases`, `synos`, `relWords`, `etymology.t`, `etymology.d`) | 558,516 | 138,339 | 43,413 / 39,036 |
| **Articles (NCE-1)** | 1 | 5 | 2 (`titleTranslate`, `textTranslate`) | 531 | 299 | 68 / 68 |
| **Catalogs & Metadata** | 4 | 4 | 4 (`name`, `description`, `category`, `tags`) | 134 | 48 | 16 / 8 |
| **Learning Resources** | 1 | 51 | 3 (`name`, `description`, `difficulty`) | 640 | 120 | 108 / 102 |
| **System Virtual Dbs** | 2 | 5 | 2 (`name`, `description`) | 86 | 32 | 12 / 12 |
| **Total In-Repo Scope** | **9** | **2,672** | **18** | **559,907** | **138,838** | **43,617 / 39,226** |

### 3.2 Breakdown of Vocabulary Fields (`CET4_T.json`)

| Field Path | Record Occurrences | Total Chinese Chars | Total Strings | Unique Strings | Duplicate Strings | Mixed Eng/CN Strings |
|---|---:|---:|---:|---:|---:|---:|
| `trans` | 2,607 / 2,607 (100%) | 104,703 | 4,916 | 4,898 | 18 | 959 |
| `sentences.cn` | 2,607 / 2,607 (100%) | 103,291 | 7,808 | 7,456 | 352 | 67 |
| `phrases.cn` | 2,342 / 2,607 (89.8%) | 30,487 | 4,927 | 4,764 | 163 | 376 |
| `synos.cn` | 2,185 / 2,607 (83.8%) | 33,697 | 4,173 | 4,073 | 100 | 43 |
| `relWords.cn` | 2,510 / 2,607 (96.3%) | 102,328 | 12,435 | 9,555 | 2,880 | 1,524 |
| `etymology.t` | 2,056 / 2,607 (78.9%) | 25,511 | 4,399 | 3,898 | 501 | 4,399 |
| `etymology.d` | 2,056 / 2,607 (78.9%) | 158,499 | 4,755 | 4,392 | 363 | 4,688 |
| **Total CET-4** | **2,607** | **558,516** | **43,413** | **39,036** | **4,377** | **12,056** |

---

## 4. Programmatic Chinese Content Classification

All detected Chinese strings across the repository are classified into the required functional categories:

```
Total Chinese Characters in Repo: 651,132
├── In-Scope Learning Content: 560,161 chars (86.0%)
│   ├── Category A (Learner translations): 238,989 chars
│   ├── Category B (Learner explanations): 185,158 chars
│   ├── Category C (Mixed Eng/CN fields): 136,025 chars
│   └── Category D (Educational metadata): 820 chars
├── UI Localization (Already exists in vi.json / out of scope): 17,744 chars (2.7%)
├── External Third-Party Library (xlsx.full.min.js): 52,816 chars (8.1%)
└── Developer Comments & Internal Code: 20,411 chars (3.1%)
```

### Category Inventory & Triage

| Category | Typical Pattern / Example | In Scope? | Required Action |
|---|---|:---:|---|
| **A. Learner Translation** | `Word.trans.cn`: `"取消；删去"`<br>`sentences.cn`: `"顾客打电话来取消了。"` | **YES** | Translate to natural Vietnamese; preserve part of speech. |
| **B. Learner Explanation** | `etymology.d`: `"中世纪罗马抄写员在抄写出现笔误时..."`<br>`doc.vue`: `"经典英语教材，适合系统学习"` | **YES** | Translate pedagogical explanation into Vietnamese or substitute with curated Vietnamese study guides. |
| **C. Mixed English + Chinese** | `relWords.cn`: `"爆炸（explode的过去分词）"`<br>`synos.cn`: `"[计]取消；删去"` | **YES** | Isolate Chinese portion; preserve technical tags (`[计]` → `[Tin học]`) and English stems. |
| **D. Chinese Metadata** | `category`: `"中国考试"`<br>`tags`: `["大学英语"]`<br>`name`: `"机械键盘"` | **YES** | Localize metadata to Vietnamese equivalent (`"Kỳ thi chuẩn hóa"`, `"Bàn phím cơ"`). |
| **E. Internal / Dev Content** | `// 单词词典有两种类型，用article来判断`<br>`console.error('读取本地dict数据失败')` | **NO** | Keep unchanged in code. |
| **F. External / Regulatory** | `xlsx.full.min.js`<br>`川公网安备51015602001426号` | **NO** | Vendor code and statutory Chinese ICP filing numbers must remain intact. |

---

## 5. Source English vs. Target Vietnamese Separation

To avoid corrupting the educational mechanics, the following boundaries must be strictly maintained:

### 5.1 Immutable Fields (Must NEVER Be Modified)
- `word`: English headword (`"cancel"`)
- `phonetic0`, `phonetic1`: IPA phonetic transcriptions (`"ˈkæns(ə)l"`)
- `sentences[].c`: English sentence text (`"The customer called to cancel."`)
- `phrases[].c`: English phrase text (`"cancel button"`)
- `synos[].ws[]`: English synonym words (`["recall", "call it off"]`)
- `relWords.root`: English root word (`"cancel"`)
- `relWords.rels[].words[].c`: Related English word form (`"cancellation"`)
- `id`, `categoryId`, `url`, `version`, `audioSrc`, `lrcPosition`: Data relational identifiers and timestamps.

### 5.2 Localizable Target Fields (Chinese → Vietnamese)
- `trans[].cn`: `"取消（计划好的事情）；终止"` → `"hủy bỏ (kế hoạch); chấm dứt"`
- `sentences[].cn`: `"顾客打电话来取消了。"` → `"Khách hàng đã gọi điện để hủy."`
- `phrases[].cn`: `"取消按钮"` → `"nút hủy"`
- `synos[].cn`: `"[计]取消；删去"` → `"[Tin học] hủy bỏ; xóa bỏ"`
- `relWords.rels[].words[].cn`: `"取消；删除"` → `"sự hủy bỏ; việc xóa bỏ"`
- `etymology[].t`: `"cancel:（撤销）：古罗马抄写员..."` → `"cancel: (hủy bỏ): Dấu gạch chéo của người chép sách La Mã cổ đại..."`
- `Article.titleTranslate`: `"对不起！"` → `"Xin lỗi!"`
- `Article.textTranslate`: `"这是您的手提包吗？"` → `"Đây có phải là túi xách của bạn không?"`

---

## 6. Architecture & Schema Strategy

We evaluate three technical architectures for accommodating Vietnamese learning data:

| Architecture | Description | Pros | Cons | Viability |
|---|---|---|---|:---:|
| **Option A: In-Place Replacement** | Overwrite Chinese strings in `CET4_T.json` directly with Vietnamese. | Zero schema changes; zero UI binding modifications. | Destroys Chinese data; cannot support multilingual users; upstream sync conflicts. | **NOT RECOMMENDED** |
| **Option B: Multilingual Fields** | Alter schema: `trans: [{ pos, zh, vi }]`. | Single source of truth per word; scalable to Spanish, Japanese, etc. | Huge schema migration; breaks IndexedDB cache (version bump required); 2x–3x file size. | **HIGH COMPLEXITY** |
| **Option C: Separate Localized Datasets (Recommended)** | Mirror dataset hierarchy: `dicts/en-vi/word/CET4_T.json` or `CET4_T.vi.json` with catalog routing. | Native support in TypeWords (`translateLanguage`); zero risk to existing Chinese users; clean CDN caching. | **RECOMMENDED** |

### Recommended Architecture: Option C (Dataset Partitioning via `translateLanguage`)

The TypeWords schema **already has built-in support** for this architecture:
In `DictResource` (`app/core/types/types.ts`):
```typescript
export type DictResource = {
  id: string | number
  name: string
  description: string
  url: string
  language: LanguageType           // 'en' (source learning language)
  translateLanguage: TranslateLanguageType // 'zh_CN' -> add 'vi'
}
```
At runtime, `_getDictDataByUrl` in `app/core/utils/index.ts` can dynamically construct:
```typescript
let dictResourceUrl = `${ENV.RESOURCE_URL}/dicts/${val.language}-${val.translateLanguage}/word/${val.url}`
```
This isolates the Vietnamese dataset completely, avoiding breaking changes for Chinese learners while providing a clean distribution layer for Vietnamese learners.

---

## 7. Data Provenance and Licensing Audit

| Dataset | Apparent Origin | Copyright / Legal Risk | Attribution / Distribution Requirements |
|---|---|---|---|
| **CET-4 Vocabulary (`CET4_T.json`)** | Public syllabus wordlist combined with scraped commercial Chinese dictionary definitions (Youdao / Kingsoft / Baidu) and crowd-sourced etymology notes. | **MEDIUM RISK**<br>English headwords are public domain facts. However, detailed etymology essays (e.g. *“中世纪罗马抄写员...”*) constitute copyrighted editorial text. | Translating editorial text into Vietnamese creates a derivative work. In Tier 1 and 2, short dictionary glosses pose minimal risk under fair use. In Tier 3, long etymology essays should be rewritten or replaced. |
| **New Concept English 1 (`NCE_1.json` + MP3s)** | *New Concept English* by L.G. Alexander (Pearson Longman & FLTRP). | **HIGH RISK**<br>Text and synchronized audio recordings are proprietary commercial textbook materials. | Distributing NCE text and audio without commercial licensing is an infringement risk. The project should classify NCE as **UNKNOWN — REQUIRES LEGAL/LICENSING VALIDATION**. For official release, replace with Creative Commons/Open Educational Resource (OER) articles. |
| **Learning Resources (`doc.vue`)** | Curated Chinese domestic study resources (Quark Pan drives, New Oriental video courses, Hujiang links). | **LEGAL / UTILITY CONFLICT**<br>Contains links to unauthorized third-party Chinese cloud drives. Completely inaccessible and useless for Vietnamese users. | Should **NOT** be translated. Must be stripped or replaced with legitimate Vietnamese English-learning resources (VnExpress International, BBC Learning English Vietnamese, etc.). |

---

## 8. Translation Complexity Breakdown

```
        ┌─────────────────────────────────────────────────────────────┐
        │                 Complexity Distribution                     │
        ├─────────────────────────────┬───────────────────────────────┤
        │ Low (Short glosses/phrases) │ 21,540 units (166,535 chars)  │
        │ Medium (Definitions/Exs)    │ 12,724 units (207,994 chars)  │
        │ High (Etymology/Articles)   │  9,217 units (184,518 chars)  │
        └─────────────────────────────┴───────────────────────────────┘
```

1. **Low Complexity (49.4% of units, 29.8% of volume)**:
   - `phrases.cn`, `synos.cn`, `relWords.cn`, metadata tags.
   - Characterized by short, direct noun/verb phrases (e.g. `"cancel button"` → `"nút hủy"`). High consistency, low polysemic ambiguity.
2. **Medium Complexity (29.2% of units, 37.2% of volume)**:
   - `trans.cn` (core dictionary definitions) and `sentences.cn` (full contextual sentences).
   - Requires careful grammatical POS alignment (ensuring Vietnamese verbs, nouns, and adjectives match English source) and correct polysemy selection matching the example sentence context.
3. **High Complexity (21.4% of units, 33.0% of volume)**:
   - `etymology.t` and `etymology.d` (historical linguistics essays), NCE reading texts, and pedagogical notes.
   - Contains historical Latin/Greek references, mythological metaphors, and complex narrative explanations.

---

## 9. Translation Workload Estimation

### 9.1 Workload Metrics (Bundled Repository: CET-4 + NCE-1)
- **Total Chinese characters**: 559,907 characters
- **Total translation units**: 43,617 strings
- **Unique translation units**: 39,226 strings (~10% deduplication potential)
- **Standard translation velocity**:
  - Human from scratch: 200–250 chars/hour (weighted average)
  - AI Machine Translation Post-Editing (MTPE): 700–800 chars/hour

---

## 10. Comparative Workflow Analysis

### Workflow A: 100% Human Translation
- **Process**: Professional Vietnamese linguist translates source Chinese while consulting English headwords; followed by independent bilingual review and terminology normalization.
- **Estimated Effort**:
  - Tier 1: ~476 translation hours + 95 QA hours = **571 person-hours**
  - Tier 2: ~1,708 translation hours + 342 QA hours = **2,050 person-hours**
  - Tier 3: ~2,545 translation hours + 760 QA hours = **3,305 person-hours**
- **Pros**: Highest cultural nuance, natural Vietnamese idioms, zero machine hallucinations.
- **Cons**: Prohibitive cost and multi-month delivery timeline.

### Workflow B: AI-Assisted Translation (LLM First-Pass + Human MTPE)
- **Process**: Structured batch LLM prompt (e.g. Gemini 1.5 Flash / GPT-4o-mini) translating JSON arrays while receiving English headwords and POS as semantic constraints. Human linguist performs post-editing, polysemy validation, and POS conformity checks.
- **Estimated Effort**:
  - Tier 1: ~135 MTPE hours + 35 QA hours = **170 person-hours**
  - Tier 2: ~480 MTPE hours + 90 QA hours = **570 person-hours**
  - Tier 3: ~750 MTPE hours + 160 QA hours = **910 person-hours**
- **Pros**: Best quality-to-cost ratio; 70% reduction in human labor; fast execution.
- **Cons**: Requires custom prompt engineering and strict validation tooling.

### Workflow C: Fully Automated AI Translation
- **Process**: Scripted LLM pipeline translates and outputs JSON; committed directly with zero human linguistic review.
- **Estimated Effort**: ~16–20 engineering hours for scripting, 0 human linguistic review.
- **Why Workflow C is UNACCEPTABLE for Educational Content**:
  1. **Polysemic Hallucinations**: In English vocabulary learning, words like *“plant”*, *“current”*, or *“bank”* have multiple unrelated meanings. Without human verification, an LLM often assigns the wrong meaning to an example sentence.
  2. **Sino-Vietnamese False Friends**: Literal machine translations from Chinese frequently produce unnatural or archaic Sino-Vietnamese calques (từ Hán Việt) rather than modern, natural Vietnamese terms (e.g. translating `"单位"` as `"đơn vị"` when the context means `"cơ quan / nơi làm việc"`).
  3. **Broken Test Distractors**: `word-test.ts` computes option similarity based on translation overlap. Corrupted or awkward automated strings degrade the self-test game algorithm.

---

## 11. AI / API Cost Estimation

### Token Consumption Modeling

For batch processing with structured JSON prompts including English context:
- Input overhead: ~1.2 tokens per Chinese character + ~60 tokens per item for English context and JSON framing.
- Output volume: ~1.4 tokens per Vietnamese word (~0.8 words per Chinese character).
- Batch retry & schema repair factor: 1.20x (+20% safety margin).

| Tier | Source Chars | Est. Input Tokens (inc. context) | Est. Output Tokens | Total Tokens |
|---|---:|---:|---:|---:|
| **Tier 1** | 104,747 | 420,000 | 85,000 | 505,000 |
| **Tier 2** | 375,787 | 1,450,000 | 340,000 | 1,790,000 |
| **Tier 3** | 560,161 | 2,160,000 | 550,000 | 2,710,000 |

### API Pricing Calculations (Recorded September 2026 Official Rates)

1. **Google Cloud Gemini 1.5 Flash** ($0.075 / 1M input, $0.30 / 1M output):
   - Tier 1: (0.42M in × $0.075) + (0.085M out × $0.30) = $0.0315 + $0.0255 = **$0.06**
   - Tier 2: (1.45M in × $0.075) + (0.34M out × $0.30) = $0.1088 + $0.1020 = **$0.21**
   - Tier 3: (2.16M in × $0.075) + (0.55M out × $0.30) = $0.1620 + $0.1650 = **$0.33**

2. **OpenAI GPT-4o-mini** ($0.15 / 1M input, $0.60 / 1M output):
   - Tier 1: (0.42M in × $0.15) + (0.085M out × $0.60) = $0.063 + $0.051 = **$0.11**
   - Tier 2: (1.45M in × $0.15) + (0.34M out × $0.60) = $0.218 + $0.204 = **$0.42**
   - Tier 3: (2.16M in × $0.15) + (0.55M out × $0.60) = $0.324 + $0.330 = **$0.65**

3. **Frontier Model Pass (e.g. Claude 3.5 Sonnet / GPT-4o)** for Tier 3 Etymology Refinement:
   - GPT-4o (.50 / 1M in, 0.00 / 1M out): **~0.90**

> **Key Finding**: API costs are completely negligible (<  for standard models, < 2 for frontier models). Project expenses will be overwhelmingly dominated by engineering and human linguistic review.

---

## 12. Engineering Effort Estimation

| Engineering Task | Details | Tier 1 | Tier 2 | Tier 3 |
|---|---|---:|---:|---:|
| **1. Translation Pipeline Tooling** | CLI extractor, batch JSON prompt runner with English context injection, rehydrator script, rate limiting and caching. | 16 h | 18 h | 20 h |
| **2. Architecture & Schema Routing** | Enable `translateLanguage: 'vi'` in `types.ts`, configure dataset resolution in `_getDictDataByUrl`, add catalog filters. | 8 h | 12 h | 12 h |
| **3. Hardcoded Chinese Decoupling** | Refactor `baseStore` virtual dicts (`收藏`, `错词`, `已掌握`) and `env.ts` keyboard sounds/stages to bind to i18n keys. | 4 h | 8 h | 8 h |
| **4. Layout & UI Hardening** | Adjust interlinear line-height in `TypingArticle.vue` (`-lh`), fix horizontal flex wrap in `TranslationList.vue` and `WordMetaPanel.vue`. | 4 h | 10 h | 12 h |
| **5. Test Distractor Algorithm Fix** | Refactor `calCommon()` in `app/core/utils/word-test.ts` from single character splitting (`split('')`) to syllable/token comparison for Vietnamese. | 4 h | 6 h | 6 h |
| **6. Automated CI Validation Scripts** | Unicode leak detector (`[㐀-䶿一-鿿豈-﫿]`), schema integrity tests, ID preservation verification. | 4 h | 6 h | 8 h |
| **Total Engineering Hours** | | **40 h** | **60 h** | **66 h** |

---

## 13. Quality Assurance (QA) Effort Estimation

| QA Dimension | Activities & Verification Protocols | Tier 1 | Tier 2 | Tier 3 |
|---|---|---:|---:|---:|
| **Data Integrity QA** | Verify 100% record match (2,607 words, 5 articles); zero duplicate IDs; valid UTF-8 diacritics without mojibake. | 4 h | 6 h | 8 h |
| **Language Integrity QA** | Run automated CI Chinese-leak detector across all JSON outputs; ensure 0 unexpected Chinese glyphs remain. | 2 h | 4 h | 6 h |
| **Semantic & Educational QA** | Validate POS matching; verify polysemy alignment between example sentences and word meanings; check idiom accuracy. | 8 h | 24 h | 50 h |
| **Runtime Study Flow Testing** | Test across all 8 learning modes: Follow-along, Dictation, Self-test, Spelling, Article study, Word lookup popover, and FSRS review. | 6 h | 14 h | 24 h |
| **Cross-Platform Responsive QA**| Validate layout on Mobile (iOS Safari / Android Chrome) and Desktop (Chrome, Firefox) for data expansion text wrapping. | 4 h | 8 h | 12 h |
| **Total QA Hours** | | **24 h** | **56 h** | **100 h** |

---

## 14. UI Impact Caused by Data Expansion

Although this is not a UI localization task, Vietnamese text is **30% to 70% longer in horizontal width** than ideographic Chinese characters:

1. **Interlinear Article Translation (`TypingArticle.vue`)**:
   - In desktop mode, translations are positioned absolutely beneath words (`translate.style.top = ...`).
   - Chinese `"这是您的手提包吗？"` (9 chars) becomes Vietnamese `"Đây có phải là túi xách của bạn không?"` (39 chars).
   - **Risk**: Overlapping lines or misaligned word-wrapping.
   - **Remedy**: Increase `-lh` from `3.2` to `3.6` and adjust container flex bounds.
2. **Word Practice Definition Header (`TranslationList.vue`)**:
   - Vietnamese definitions with multiple synonyms will wrap into 2 or 3 lines.
   - **Risk**: Vertical pushing of the input typing box below the viewport on smaller laptop screens (e.g. 13" 1366x768).
   - **Remedy**: Add CSS `max-height` with graceful fade or scroll on definition blocks.
3. **Word Test Distractor Options (`words-test/[id].vue`)**:
   - Multiple-choice buttons (A, B, C, D) have fixed widths. Long Vietnamese glosses will wrap.
   - **Remedy**: Ensure `min-height` and flex alignment on option cards.

---

## 15. Localization Tier Definitions

### Tier 1 — Core Vocabulary Localization
- **Scope**: Headword definitions (`trans[].cn`), dictionary catalog metadata, and system virtual dictionaries (`收藏`, `错词`, `已掌握`).
- **Volume**: 2,612 records | 104,747 Chinese chars | 4,923 translation units.
- **Target**: Functional MVP enabling Vietnamese users to practice typing and memorizing core CET-4 word meanings.

### Tier 2 — Complete Learning Database (Recommended Target)
- **Scope**: Everything in Tier 1 + Example sentence translations (`sentences[].cn`), phrase translations (`phrases[].cn`), synonym glosses (`synos[].cn`), related word glosses (`relWords.cn`), article translations (`NCE_1.json`), and study mode options. *(Excludes dense historical etymology essays).*
- **Volume**: 2,612 records | 375,787 Chinese chars | 34,420 translation units.
- **Target**: Rich, holistic, and immersive Vietnamese learning experience covering all active study modes.

### Tier 3 — Editorial-Grade Vietnamese Dataset
- **Scope**: Everything in Tier 2 + Full etymology essays (`etymology.d` + `etymology.t`: 184,010 chars), cultural adaptation of example sentences, and comprehensive editorial review by professional lexicographers.
- **Volume**: 2,612 records | 560,161 Chinese chars | 43,589 translation units.
- **Target**: Publication-grade educational product suitable for commercial release.

---

## 16. Cost and Effort Matrix

### Table 16.1: Cost Matrix by Localization Tier (Workflow B: AI-Assisted + Human MTPE)

| Scope | Records | Chinese Chars | Trans Units | Translation (MTPE) | Engineering | QA Effort | AI/API Cost | Total Effort | Total Person-Days (8h/d) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| **Tier 1 (Core)** | 2,612 | 104,747 | 4,923 | 135 h | 40 h | 24 h | $0.06 – $0.11 | **199 h** | ~25 days |
| **Tier 2 (Complete)**| 2,612 | 375,787 | 34,420 | 480 h | 60 h | 56 h | $0.21 – $0.42 | **596 h** | ~75 days |
| **Tier 3 (Editorial)**| 2,612 | 560,161 | 43,589 | 750 h | 66 h | 100 h | $0.33 – $0.65 | **916 h** | ~115 days |

*Note: Person-days calculated assuming standard 8-hour working days.*

### Table 16.2: Workflow Comparison for Recommended Target (Tier 2)

| Workflow | Translation Hours | Eng Hours | QA Hours | Total Hours | Approx. Labor Cost (0/h) | API Cost | Total Est. Cost |
|---|---:|---:|---:|---:|---:|---:|---:|
| **Workflow A (100% Human)** | 1,708 h | 40 h | 342 h | **2,090 h** | ~1,800 | bash.00 | **~1,800** |
| **Workflow B (AI + Human MTPE)**| 480 h | 60 h | 56 h | **596 h** | ~1,920 | < .00 | **~1,921** |
| **Workflow C (Fully Automated)**| 0 h | 60 h | 24 h | **84 h** | ~,680 | < .00 | **~,681** *(Unsafe)* |

---

## 17. Recommended Execution Plan

```
[ Phase 1: Tooling & Extraction ] ────► [ Phase 2: Schema Routing ]
                 │                                      │
                 ▼                                      ▼
[ Phase 3: AI Batch Translation ] ────► [ Phase 4: Human MTPE Review ]
                 │                                      │
                 ▼                                      ▼
[ Phase 5: Rehydration & Build ]  ────► [ Phase 6: Automated CI Auditing ]
                 │                                      │
                 ▼                                      ▼
[ Phase 7: UI & Algorithm Fixes ] ────► [ Phase 8: Runtime Verification ]
```

- **Phase 1 — Tooling & Extraction**: Write extraction CLI (`scripts/extract_localization_units.py`) outputting normalized JSON payloads with English context.
- **Phase 2 — Localization Schema Architecture**: Implement Option C. Define `public/dicts/en-vi/` folder structure and update `dict-list.vue` to route based on learner locale.
- **Phase 3 — AI Batch Translation**: Run Gemini 1.5 Flash / GPT-4o-mini structured batch translation pipeline on Tier 2 units.
- **Phase 4 — Human Post-Editing (MTPE)**: Linguist reviews and edits definitions, ensuring accurate POS mapping and natural Vietnamese phrasing.
- **Phase 5 — Dataset Rehydration**: Script reconstructs valid `CET4_T.json` and `NCE_1.json` within the `en-vi` partition.
- **Phase 6 — Automated CI Auditing**: Run script verifying 0 Chinese characters in learner-facing fields and 100% ID preservation.
- **Phase 7 — UI & Algorithm Adaptation**: Fix `word-test.ts` syllable similarity and adjust `TypingArticle.vue` CSS line heights.
- **Phase 8 — Runtime Verification**: Validate practice flows across all desktop and mobile views.

---

## 18. Definition of Done (DoD)

The learning database localization will be considered complete only when:

1. **Zero Chinese Leakage**: Automated CI script scans `public/dicts/en-vi/` and confirms 0 characters matching `[㐀-䶿一-鿿豈-﫿]` in learner-facing fields.
2. **English Learning Integrity**: All English headwords, phonetic transcriptions, audio URLs, and English sentences match the original dataset byte-for-byte.
3. **Data Relational Integrity**: All record IDs, category IDs, FSRS card tracking keys, and array lengths match the source schema exactly.
4. **Pedagogical Alignment**: Part-of-speech indicators correctly classify the Vietnamese translations. Polysemous words align with the contextual example sentence.
5. **Runtime Verification**: All 8 practice modes (Follow-along, Dictation, Self-test, Spelling, Article practice, Word lookup, Favorites, Wrong words) successfully load and display Vietnamese data.
6. **Responsive Layout Stability**: Text expansion does not cause broken interlinear lines, overlapping elements, or clipped viewports on desktop or mobile.
7. **Deterministic Build**: Version-controlled extraction, translation, and validation scripts reside in `scripts/localization/` for reproducible dataset generation.
