import assert from 'node:assert'
import {
  DictId,
  getBookName,
  getBookDescription,
  normalizeLegacySystemBook,
  normalizeWordBookList,
  normalizeArticleBookList,
  migrateSaveDict,
} from '../app/core/utils/migration.ts'

console.log('--- Running DB Migration & Normalization Tests ---')

// Mock $t translation function
const viTranslations: Record<string, string> = {
  'books.wordCollect': 'Yêu thích',
  'books.wordWrong': 'Từ hay sai',
  'books.wordKnown': 'Đã thành thạo',
  'books.wordKnown_desc': 'Các từ đã thành thạo sẽ không xuất hiện trong bài luyện tập',
  'books.articleCollect': 'Yêu thích',
}

const enTranslations: Record<string, string> = {
  'books.wordCollect': 'Favorites',
  'books.wordWrong': 'Wrong Words',
  'books.wordKnown': 'Mastered',
  'books.wordKnown_desc': 'Mastered words will not appear in practice',
  'books.articleCollect': 'Favorites',
}

const mockT_VI = (k: string) => viTranslations[k] || k
const mockT_EN = (k: string) => enTranslations[k] || k

// Test 1: getBookName Presentation Layer
console.log('Test 1: getBookName presentation layer resolution')
assert.strictEqual(getBookName({ id: DictId.wordCollect, name: '' }, mockT_VI), 'Yêu thích')
assert.strictEqual(getBookName({ id: DictId.wordCollect, name: '' }, mockT_EN), 'Favorites')
assert.strictEqual(getBookName({ id: DictId.wordWrong, name: '' }, mockT_VI), 'Từ hay sai')
assert.strictEqual(getBookName({ id: DictId.wordWrong, name: '' }, mockT_EN), 'Wrong Words')
assert.strictEqual(getBookName({ id: DictId.wordKnown, name: '' }, mockT_VI), 'Đã thành thạo')
assert.strictEqual(getBookName({ id: DictId.wordKnown, name: '' }, mockT_EN), 'Mastered')
// Custom book preserves its custom name
assert.strictEqual(getBookName({ id: 'my-custom-1', name: 'Từ vựng IELTS' }, mockT_VI), 'Từ vựng IELTS')
assert.strictEqual(getBookName({ id: 'my-custom-1', name: 'Từ vựng IELTS' }, mockT_EN), 'Từ vựng IELTS')
// Legacy Chinese name fallback
assert.strictEqual(getBookName({ id: 'wordCollect', name: '收藏' }, mockT_VI), 'Yêu thích')
assert.strictEqual(getBookName({ id: 'wordWrong', name: '错词' }, mockT_EN), 'Wrong Words')
console.log('  [PASS] Test 1 passed')

// Test 2: normalizeLegacySystemBook with Chinese legacy records
console.log('Test 2: Normalizing legacy Chinese system book records')
const legacyChineseWordCollect = {
  id: '收藏',
  name: '收藏',
  words: [{ word: 'abandon', trans: [] }],
}
const normChineseCollect = normalizeLegacySystemBook(legacyChineseWordCollect, 'word')
assert.strictEqual(normChineseCollect.id, DictId.wordCollect)
assert.strictEqual(normChineseCollect.enName, DictId.wordCollect)
assert.strictEqual(normChineseCollect.name, '')
assert.strictEqual(normChineseCollect.system, true)
assert.strictEqual(normChineseCollect.words.length, 1)

const legacyChineseWordWrong = {
  id: '错词',
  name: '错词',
  words: [{ word: 'ability', trans: [] }],
}
const normChineseWrong = normalizeLegacySystemBook(legacyChineseWordWrong, 'word')
assert.strictEqual(normChineseWrong.id, DictId.wordWrong)
assert.strictEqual(normChineseWrong.enName, DictId.wordWrong)
assert.strictEqual(normChineseWrong.name, '')
assert.strictEqual(normChineseWrong.system, true)

const legacyChineseWordKnown = {
  id: '已掌握',
  name: '已掌握',
  description: '已掌握后的单词不会出现在练习中',
  words: [{ word: 'hello', trans: [] }],
}
const normChineseKnown = normalizeLegacySystemBook(legacyChineseWordKnown, 'word')
assert.strictEqual(normChineseKnown.id, DictId.wordKnown)
assert.strictEqual(normChineseKnown.enName, DictId.wordKnown)
assert.strictEqual(normChineseKnown.name, '')
assert.strictEqual(normChineseKnown.description, '')
assert.strictEqual(normChineseKnown.system, true)
console.log('  [PASS] Test 2 passed')

// Test 3: normalizeLegacySystemBook with English legacy records
console.log('Test 3: Normalizing legacy English system book records')
const legacyEnglishCollect = {
  id: 'wordCollect',
  name: 'Favorites',
  words: [{ word: 'world', trans: [] }],
}
const normEnglishCollect = normalizeLegacySystemBook(legacyEnglishCollect, 'word')
assert.strictEqual(normEnglishCollect.id, DictId.wordCollect)
assert.strictEqual(normEnglishCollect.name, '')
assert.strictEqual(normEnglishCollect.system, true)
console.log('  [PASS] Test 3 passed')

// Test 4: Custom books preserved
console.log('Test 4: Preserving custom books and words')
const customBook = {
  id: 'custom_ielts_3000',
  name: 'IELTS Academic 3000',
  custom: true,
  words: [{ word: 'ubiquitous', trans: [] }, { word: 'ephemeral', trans: [] }],
}
const normCustom = normalizeLegacySystemBook(customBook, 'word')
assert.strictEqual(normCustom.id, 'custom_ielts_3000')
assert.strictEqual(normCustom.name, 'IELTS Academic 3000')
assert.strictEqual(normCustom.custom, true)
assert.strictEqual(normCustom.words.length, 2)
console.log('  [PASS] Test 4 passed')

// Test 5: normalizeWordBookList merges words and guarantees all 3 system books
console.log('Test 5: normalizeWordBookList guarantees system books and merges words')
const messyList = [
  { id: '收藏', name: '收藏', words: [{ word: 'apple' }] },
  { id: 'custom-1', name: 'My List', custom: true, words: [{ word: 'banana' }] },
  { id: DictId.wordCollect, name: 'Favorites', words: [{ word: 'orange' }, { word: 'apple' }] }, // duplicate word apple
]
const normalizedBooks = normalizeWordBookList(messyList)
assert.strictEqual(normalizedBooks.length, 4) // wordCollect, wordWrong, wordKnown + custom-1
const collectBook = normalizedBooks.find((b) => b.id === DictId.wordCollect)!
assert.ok(collectBook)
assert.strictEqual(collectBook.words.length, 2) // apple, orange (deduplicated)
assert.strictEqual(collectBook.name, '')

const wrongBook = normalizedBooks.find((b) => b.id === DictId.wordWrong)!
assert.ok(wrongBook)
assert.strictEqual(wrongBook.words.length, 0) // created empty by default

const customRes = normalizedBooks.find((b) => b.id === 'custom-1')!
assert.ok(customRes)
assert.strictEqual(customRes.name, 'My List')
console.log('  [PASS] Test 5 passed')

// Test 6: checkAndUpgradeSaveDict full upgrade with FSRS and Note data preservation
console.log('Test 6: checkAndUpgradeSaveDict with full state, FSRS and Note data')
const mockLegacySaveData = {
  version: 4,
  val: {
    word: {
      bookList: [
        { id: '收藏', name: '收藏', words: [{ word: 'serendipity' }] },
        { id: '错词', name: '错词', words: [{ word: 'misspell' }] },
        { id: '已掌握', name: '已掌握', words: [{ word: 'cat' }] },
        { id: 'custom-ielts', name: 'IELTS Band 8', custom: true, words: [{ word: 'aesthetic' }] },
      ],
      studyIndex: 3,
    },
    article: {
      bookList: [
        { id: '收藏', name: '收藏', articles: [{ id: 'art-1', title: 'The Old Man and the Sea' }] },
      ],
      studyIndex: 0,
    },
    fsrsData: {
      serendipity: {
        due: '2026-09-08T00:00:00.000Z',
        stability: 2.5,
        difficulty: 4.1,
        elapsed_days: 1,
        scheduled_days: 3,
        reps: 2,
        lapses: 0,
        state: 1,
        last_review: '2026-09-07T00:00:00.000Z',
      },
    },
    noteData: {
      serendipity: 'Tình cờ bắt gặp điều thú vị',
    },
  },
}

async function runAsyncTests() {
  const migratedState = migrateSaveDict(mockLegacySaveData.val)

  // System books normalized
  assert.strictEqual(migratedState.word.bookList[0].id, DictId.wordCollect)
  assert.strictEqual(migratedState.word.bookList[0].name, '')
  assert.strictEqual(migratedState.word.bookList[0].words[0].word, 'serendipity')

  assert.strictEqual(migratedState.word.bookList[1].id, DictId.wordWrong)
  assert.strictEqual(migratedState.word.bookList[1].name, '')
  assert.strictEqual(migratedState.word.bookList[1].words[0].word, 'misspell')

  assert.strictEqual(migratedState.word.bookList[2].id, DictId.wordKnown)
  assert.strictEqual(migratedState.word.bookList[2].name, '')
  assert.strictEqual(migratedState.word.bookList[2].words[0].word, 'cat')

  // Custom book preserved
  const migratedCustom = migratedState.word.bookList.find((b: any) => b.id === 'custom-ielts')
  assert.ok(migratedCustom)
  assert.strictEqual(migratedCustom.name, 'IELTS Band 8')
  assert.strictEqual(migratedCustom.words[0].word, 'aesthetic')

  // Article book normalized
  assert.strictEqual(migratedState.article.bookList[0].id, DictId.articleCollect)
  assert.strictEqual(migratedState.article.bookList[0].name, '')
  assert.strictEqual(migratedState.article.bookList[0].articles[0].id, 'art-1')

  // FSRS and Note data preserved intact
  assert.ok(migratedState.fsrsData.serendipity)
  assert.strictEqual(migratedState.fsrsData.serendipity.reps, 2)
  assert.strictEqual(migratedState.noteData.serendipity, 'Tình cờ bắt gặp điều thú vị')

  // Test 7: Idempotency (migrating an already migrated state changes nothing)
  console.log('Test 7: Migration Idempotency')
  const reMigrated = migrateSaveDict(migratedState)
  assert.strictEqual(reMigrated.word.bookList.length, migratedState.word.bookList.length)
  assert.strictEqual(reMigrated.word.bookList[0].words.length, migratedState.word.bookList[0].words.length)
  assert.strictEqual(reMigrated.article.bookList[0].articles.length, migratedState.article.bookList[0].articles.length)
  assert.strictEqual(reMigrated.noteData.serendipity, 'Tình cờ bắt gặp điều thú vị')
  console.log('  [PASS] Test 7 passed')

  console.log('[SUCCESS] All DB migration and normalization tests passed successfully.')
}

runAsyncTests().catch((err) => {
  console.error('❌ DB migration test failed:', err)
  process.exit(1)
})
