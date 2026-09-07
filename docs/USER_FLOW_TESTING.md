# TypeWords — Manual User Flow Testing Checklist

**Branch:** `feat/vi-en-localization`  
**Version:** See `About` page (commit hash shown in footer)  
**Target audience:** Human QA tester, Vietnamese-speaking  
**App URL (local):** `http://localhost:5567`  
**Locale default:** Vietnamese (`vi`) — all UI should appear in Vietnamese by default  

> [!IMPORTANT]
> Run all flows in a **clean browser profile** (no saved TypeWords data) first.  
> Then repeat key flows with **migrated legacy data** (see Flow J).  
> Use **Chrome** or **Chromium** for full IndexedDB + ServiceWorker support.

---

## Pre-flight Setup

```bash
# Start local dev server
pnpm run dev
# App runs at http://localhost:5567
```

Open **DevTools → Application → IndexedDB** to observe data state during testing.

---

## Flow A — First Launch & Locale Default

**Goal:** App loads in Vietnamese with no errors, no Chinese strings visible.

| Step | Action | Expected |
|------|--------|----------|
| A1 | Open `http://localhost:5567` in fresh profile | Landing page loads, no blank screen |
| A2 | Inspect all visible text on landing page | All UI text is in **Vietnamese** (not Chinese) |
| A3 | Open browser console | Zero `[Vue warn]` or `TypeError` errors |
| A4 | Check URL bar | URL is `/` or `/vi/` (Vietnamese prefix, NOT `/zh/` or `/cn/`) |
| A5 | Inspect `<html lang="">` attribute | Should be `vi` |
| A6 | Search page for any Chinese characters (Ctrl+F `[\u4e00-\u9fff]`) | **Zero** Chinese UI strings visible |
| A7 | Open DevTools → Network → check for requests to `hm.baidu.com` | **None** — Baidu analytics removed |
| A8 | Open DevTools → Network → check for requests to `libs.typewords.cc` | **None** — upstream analytics removed |

**Pass criteria:** All steps ✅, zero Chinese strings, zero upstream analytics calls.

---

## Flow B — Language Switcher (vi ↔ en)

**Goal:** User can switch between Vietnamese and English; no locale except `vi` and `en` exists.

| Step | Action | Expected |
|------|--------|----------|
| B1 | Find language selector in UI (top-right or settings) | Shows only 2 options: `Tiếng Việt` and `English` |
| B2 | Switch to `English` | All UI text changes to English within 1 second |
| B3 | Reload page while in English | UI stays in English after reload |
| B4 | Switch back to `Tiếng Việt` | UI reverts to Vietnamese |
| B5 | Manually navigate to `/zh/` or `/cn/` | Should redirect to `/` or show 404; NOT render Chinese locale |
| B6 | Manually navigate to `/ja/`, `/ko/`, `/de/` | Same — not rendered |
| B7 | Inspect `locales` array in runtime | Only `[{code:'vi',...},{code:'en',...}]` — no others |

**Pass criteria:** Exactly 2 locales visible, no deprecated locale routes work.

---

## Flow C — Word Practice (Fresh User)

**Goal:** Core word typing flow works end-to-end in Vietnamese UI.

| Step | Action | Expected |
|------|--------|----------|
| C1 | Navigate to **Words** section | Page loads with word book list |
| C2 | Verify system books are shown in Vietnamese | "Từ yêu thích", "Từ sai", "Đã thuộc" (or locale-translated names) |
| C3 | Select a built-in vocabulary (e.g., CET-4) | Book details shown, Start button available |
| C4 | Click **Start Practice** | Practice page loads |
| C5 | Type the first word correctly | Word advances; correct visual/audio feedback |
| C6 | Type a word **incorrectly** on purpose | Error animation plays; word marked wrong |
| C7 | Verify wrong word auto-added to "Từ sai" book | Navigate to wrong words book → word appears |
| C8 | Use **Backspace** to correct a typo during input | Character removed cleanly |
| C9 | Complete a practice session | Completion screen shown in Vietnamese |
| C10 | Check DevTools → Application → IndexedDB | Data saved under correct key, no locale strings in book IDs |

**Pass criteria:** Full word practice loop completes, wrong word persisted correctly.

---

## Flow D — Vietnamese IME Input (Critical)

**Goal:** Vietnamese diacritic input via Telex/VNI IME works without characters being swallowed or doubled.

> [!IMPORTANT]
> This test **requires a Vietnamese keyboard input method** (e.g., Unikey, iBus-Unikey, or macOS Vietnamese keyboard).

| Step | Action | Expected |
|------|--------|----------|
| D1 | In any text input field in the app, enable Telex IME | IME activates normally |
| D2 | Type `viet nam` using Telex (v-i-e-t-s then space) | "việt" composes correctly, no double characters |
| D3 | Go to article practice → open article edit / add field | Input field present |
| D4 | Type Vietnamese text in article title using Telex | Diacritics appear correctly (ệ, ổ, ự, etc.) |
| D5 | Type a word for English practice while IME is active | App does NOT block IME; characters not swallowed |
| D6 | Switch IME off and type English word | English typing works normally |
| D7 | Check console for `isComposing`-related errors | None |

**Pass criteria:** Vietnamese diacritics input correctly, no characters blocked or doubled.

---

## Flow E — Article Practice

**Goal:** Article memorization flow works with Vietnamese UI.

| Step | Action | Expected |
|------|--------|----------|
| E1 | Navigate to **Articles** section | Article book list loads |
| E2 | Verify system "Bài yêu thích" (collect) book exists | Shows in Vietnamese |
| E3 | Select a built-in article book | Articles listed |
| E4 | Start article practice | Sentence-by-sentence input works |
| E5 | Type a sentence correctly | Advances to next sentence |
| E6 | Type a sentence incorrectly | Error feedback shown |
| E7 | Complete the article | Progress saved |
| E8 | Favorite an article | Article appears in "Bài yêu thích" |

**Pass criteria:** Article practice loop complete, collect book works.

---

## Flow F — Add Custom Word Book

**Goal:** User can create a custom word book and add words.

| Step | Action | Expected |
|------|--------|----------|
| F1 | Navigate to Words → click **New Book** (or equivalent) | Dialog opens in Vietnamese |
| F2 | Enter a book name in Vietnamese (e.g., "Từ vựng IELTS") | Input accepts Vietnamese diacritics |
| F3 | Save the book | Book appears in list with Vietnamese name |
| F4 | Add a word (e.g., "persevere") to the custom book | Word added successfully |
| F5 | Start practice on custom book | Practice works same as built-in |
| F6 | Export user data (Settings → Export) | ZIP file downloaded |
| F7 | Inspect exported `data.json` | Custom book name preserved, no locale keys in system book IDs |

**Pass criteria:** Custom book created, words added, export works correctly.

---

## Flow G — Settings & Customization

**Goal:** Settings UI fully localized, all toggles functional.

| Step | Action | Expected |
|------|--------|----------|
| G1 | Navigate to **Settings** | All labels in Vietnamese |
| G2 | Change keyboard sound effect | Sound plays when typing |
| G3 | Toggle dark mode (if available) | Theme switches |
| G4 | Change font size | Text size updates |
| G5 | Check shortcut keys display | Shortcuts shown, can be remapped |
| G6 | Look for any Chinese text in Settings UI | **Zero** Chinese strings |
| G7 | Open About / Info panel | Shows app version + commit hash; no Chinese |

**Pass criteria:** Settings fully in Vietnamese, all functional.

---

## Flow H — Error & Edge Cases

**Goal:** App degrades gracefully under bad conditions.

| Step | Action | Expected |
|------|--------|----------|
| H1 | Go offline (DevTools → Network → Offline) and navigate | App still usable (offline-first); no crash |
| H2 | Navigate to a non-existent route `/does-not-exist` | 404 page shown in Vietnamese |
| H3 | Open word practice, go offline mid-session, complete session | Data saved to IndexedDB; no data loss |
| H4 | Try to import a corrupted backup ZIP | Error shown in Vietnamese; app does not crash |
| H5 | Open app in Firefox | Confirm IndexedDB works (no WebKit-only APIs used) |

**Pass criteria:** No hard crashes, error messages in Vietnamese.

---

## Flow I — Production Config Verification

**Goal:** No localhost URLs or upstream analytics leak into production-like build.

> [!NOTE]
> For this flow, use the **generated static build**: `pnpm run generate` then `npx serve .output/public`

| Step | Action | Expected |
|------|--------|----------|
| I1 | Run `pnpm run generate` | Build succeeds with exit code 0 |
| I2 | Serve `.output/public` locally and open in browser | App loads from static files |
| I3 | Open DevTools → Network → All requests | Zero requests to `localhost`, `hm.baidu.com`, `libs.typewords.cc` |
| I4 | Open DevTools → Application → Sources → find `t.js` | Contains only placeholder comment, no tracking code |
| I5 | Inspect `<meta property="og:url">` in page source | Value is `https://typewords.cc/` or empty — not localhost |
| I6 | Search built JS bundles for `zyronon@163.com` | Not present |
| I7 | Search built JS bundles for `hm.baidu.com` | Not present |
| I8 | Check ServiceWorker registration in DevTools | SW registered, caches app shell |

**Pass criteria:** Zero upstream URLs in network traffic, build assets clean.

---

## Flow J — Legacy Data Migration

**Goal:** Existing user data from Chinese-locale TypeWords migrates correctly to locale-neutral state.

> [!IMPORTANT]
> This flow requires injecting **legacy fixture data** into IndexedDB before loading the app.

```javascript
// Run in DevTools console BEFORE loading the app:
// Inject legacy Chinese system book names (simulates pre-migration data)
const { openDB } = await import('https://cdn.jsdelivr.net/npm/idb@8/build/index.js')
// OR: Use the fixture from scripts/test-db-migration.ts as reference
```

**Use the migration fixture approach:**

1. Copy the legacy fixture from `scripts/test-db-migration.ts` (the `legacyZhState` object)
2. Serialize it to JSON string
3. Open DevTools → Application → IndexedDB → `keyval-store` → set key `save_dict` to that JSON

| Step | Action | Expected |
|------|--------|----------|
| J1 | Inject legacy Chinese book names into IndexedDB (see above) | Data visible in DevTools |
| J2 | Reload the app | App loads without crash |
| J3 | Navigate to Words | System books shown with **Vietnamese** names (not Chinese) |
| J4 | Verify "收藏" → "Từ yêu thích", "错词" → "Từ sai", "已掌握" → "Đã thuộc" | Migration resolved names correctly |
| J5 | Verify custom user words are **preserved** | User vocabulary not lost |
| J6 | Verify FSRS spaced-repetition data is **preserved** | Scheduling data intact |
| J7 | Navigate to Articles | System "Bài yêu thích" shown (not "收藏文章") |
| J8 | Export data and inspect `data.json` | System book IDs are `wordCollect`, `wordWrong`, `wordKnown`, `articleCollect` — no Chinese strings |
| J9 | Run migration a second time (reload again) | **Idempotent** — same result, no data corruption |

**Pass criteria:** All legacy Chinese names resolved to Vietnamese; custom user data fully preserved; migration idempotent.

---

## Flow K — Supabase Sync (Optional, if configured)

> [!NOTE]
> Skip if Supabase is not configured in `.env`. This flow requires `SUPABASE_URL` and `SUPABASE_KEY`.

| Step | Action | Expected |
|------|--------|----------|
| K1 | Configure Supabase credentials in `.env` | App loads with sync enabled |
| K2 | Log in with a test account | Auth works |
| K3 | Practice some words | Data syncs to Supabase |
| K4 | Open a second browser profile, log in same account | Data loads from cloud |
| K5 | Check that system book IDs are locale-neutral in Supabase rows | IDs are `wordCollect` etc., not Chinese strings |

---

## Summary Checklist

| Flow | Description | Result |
|------|-------------|--------|
| A | First launch & locale default | ☐ Pass / ☐ Fail |
| B | Language switcher vi ↔ en | ☐ Pass / ☐ Fail |
| C | Word practice (fresh user) | ☐ Pass / ☐ Fail |
| D | Vietnamese IME input | ☐ Pass / ☐ Fail |
| E | Article practice | ☐ Pass / ☐ Fail |
| F | Custom word book | ☐ Pass / ☐ Fail |
| G | Settings & customization | ☐ Pass / ☐ Fail |
| H | Error & edge cases | ☐ Pass / ☐ Fail |
| I | Production config verification | ☐ Pass / ☐ Fail |
| J | Legacy data migration | ☐ Pass / ☐ Fail |
| K | Supabase sync (optional) | ☐ Pass / ☐ Skip |

**Sign-off:** Tester name + date + commit hash tested against.

---

## Known Limitations (Not Blocking)

| Item | Detail | Priority |
|------|--------|----------|
| Baidu translation proxy | `devProxy /baidu` is dev-only; production needs own translation backend or API key | P2 |
| `API_BASE` env var | Empty string fallback in production — server-dependent features (sync) won't work without setting `API_BASE` | P1 (if using server) |
| `payloadExtraction` | Nuxt warns this is disabled for full-static output | P3 |
| Supabase `passwordRsaPublicKey` | Read from env var; leave empty if not using RSA auth | P2 |
