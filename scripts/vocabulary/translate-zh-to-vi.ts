/**
 * translate-zh-to-vi.ts
 *
 * Translates all Chinese (zh-CN) semantic content in dictionary files
 * to Vietnamese while preserving English words, phonetics, and metadata.
 *
 * Architecture:
 *   1. Rule-based POS label mapping (名→danh từ, etc.)
 *   2. For `cn` definition/translation fields, uses Gemini API if available,
 *      otherwise performs best-effort rule-based pass and flags for review.
 *   3. Preserves original Chinese in `cn_source` for traceability.
 *   4. Checkpoints per dictionary file for resumability.
 *
 * Usage:
 *   GEMINI_API_KEY=xxx node --strip-types scripts/vocabulary/translate-zh-to-vi.ts
 *   node --strip-types scripts/vocabulary/translate-zh-to-vi.ts           # rule-based only
 *   node --strip-types scripts/vocabulary/translate-zh-to-vi.ts --file CET4_T.json  # single file
 */

import fs from 'fs'
import path from 'path'

const PROJECT_ROOT = path.resolve(import.meta.dirname, '..', '..')
const DICT_DIR = path.resolve(PROJECT_ROOT, 'public/dicts/en/word')
const INVENTORY_PATH = path.resolve(import.meta.dirname, 'inventory.json')
const CHECKPOINT_DIR = path.resolve(import.meta.dirname, '.checkpoints')
const REPORT_PATH = path.resolve(import.meta.dirname, 'translation-report.json')

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const GEMINI_MODEL = 'gemini-2.0-flash'
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`
const BATCH_SIZE = 40 // words per Gemini API call
const API_DELAY_MS = 500

// --- Chinese detection ---
function containsChinese(text: string): boolean {
  return /[\u4e00-\u9fff\u3400-\u4dbf]/.test(text)
}

// --- POS mapping ---
const POS_MAP: Record<string, string> = {
  '名': 'danh từ', 'n.': 'd.', 'n': 'd.',
  '动': 'động từ', 'v.': 'đg.', 'v': 'đg.',
  'vt.': 'ngđ.', 'vi.': 'nđ.',
  '形': 'tính từ', 'adj.': 'tt.', 'a.': 'tt.',
  '副': 'trạng từ', 'adv.': 'trạng từ',
  '介': 'giới từ', 'prep.': 'gt.',
  '连': 'liên từ', 'conj.': 'lt.',
  '代': 'đại từ', 'pron.': 'đại từ',
  '数': 'số từ', 'num.': 'số từ',
  '冠': 'mạo từ', 'art.': 'mạo từ',
  '感': 'thán từ', 'interj.': 'thán từ',
  '助': 'trợ từ', '缩': 'viết tắt', 'abbr.': 'viết tắt',
  '叹': 'thán từ',
}

function translatePos(pos: string): string {
  if (!pos) return pos
  const trimmed = pos.trim()
  return POS_MAP[trimmed] || pos
}

// --- Gemini API translation ---
interface GeminiTranslation {
  index: number
  vi: string
}

async function translateBatchWithGemini(texts: { index: number; zh: string }[]): Promise<GeminiTranslation[]> {
  if (!GEMINI_API_KEY) return []

  const prompt = `You are a professional Chinese-Vietnamese dictionary translator for an English learning application.

Translate each numbered Chinese text below into natural, concise Vietnamese suitable for a dictionary entry.

Rules:
- Translate Chinese definitions into Vietnamese
- Do NOT translate English words that appear in the text
- Preserve semicolons (；) as separators between multiple meanings
- Use standard Vietnamese linguistic terminology
- Keep translations concise and dictionary-style
- For part-of-speech labels, use: danh từ, động từ, tính từ, trạng từ, giới từ, liên từ, đại từ
- For domain labels like [计] (computing), [医] (medicine), translate them: [tin học], [y học], etc.
- Return ONLY a JSON array of objects: [{"index": N, "vi": "translation"}, ...]

Texts to translate:
${texts.map(t => `[${t.index}] ${t.zh}`).join('\n')}

Return ONLY the JSON array, no markdown formatting.`

  try {
    const response = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 8192,
        },
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Gemini API ${response.status}: ${errText.slice(0, 200)}`)
    }

    const result = await response.json() as any
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || ''
    
    // Extract JSON from response (might be wrapped in markdown)
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error(`Could not parse Gemini response: ${text.slice(0, 200)}`)
    }
    
    return JSON.parse(jsonMatch[0])
  } catch (err: any) {
    console.warn(`   ⚠️ Gemini API error: ${err.message}`)
    return []
  }
}

// --- Word translation ---
interface WordSubContent {
  c: string
  cn: string
  cn_source?: string
}

interface TransSense {
  pos: string
  cn: string
  cn_source?: string
  frequency?: number
}

interface SynoEntry {
  pos: string
  cn: string
  cn_source?: string
  ws: string[]
}

interface EtymologyEntry {
  t: string
  d: string
  t_source?: string
  d_source?: string
}

interface RelWords {
  root: string
  rels: {
    pos: string
    words: WordSubContent[]
  }[]
}

interface WordEntry {
  id?: string | number
  word: string
  phonetic0: string
  phonetic1: string
  trans: TransSense[]
  sentences: WordSubContent[]
  phrases: WordSubContent[]
  synos: SynoEntry[]
  relWords: RelWords
  etymology: EtymologyEntry[]
  [key: string]: any
}

interface TranslationStats {
  totalFields: number
  translatedByGemini: number
  translatedByRules: number
  preserved: number
  failed: number
}

function collectChineseTexts(word: WordEntry): { path: string; text: string }[] {
  const texts: { path: string; text: string }[] = []

  // trans[].cn
  word.trans?.forEach((t, i) => {
    if (t.cn && containsChinese(t.cn)) {
      texts.push({ path: `trans.${i}.cn`, text: t.cn })
    }
  })

  // sentences[].cn
  word.sentences?.forEach((s, i) => {
    if (s.cn && containsChinese(s.cn)) {
      texts.push({ path: `sentences.${i}.cn`, text: s.cn })
    }
  })

  // phrases[].cn
  word.phrases?.forEach((p, i) => {
    if (p.cn && containsChinese(p.cn)) {
      texts.push({ path: `phrases.${i}.cn`, text: p.cn })
    }
  })

  // synos[].cn
  word.synos?.forEach((s, i) => {
    if (s.cn && containsChinese(s.cn)) {
      texts.push({ path: `synos.${i}.cn`, text: s.cn })
    }
  })

  // relWords.rels[].words[].cn
  word.relWords?.rels?.forEach((r, i) => {
    r.words?.forEach((w, j) => {
      if (w.cn && containsChinese(w.cn)) {
        texts.push({ path: `relWords.rels.${i}.words.${j}.cn`, text: w.cn })
      }
    })
  })

  // etymology[].t and .d
  word.etymology?.forEach((e, i) => {
    if (e.t && containsChinese(e.t)) {
      texts.push({ path: `etymology.${i}.t`, text: e.t })
    }
    if (e.d && containsChinese(e.d)) {
      texts.push({ path: `etymology.${i}.d`, text: e.d })
    }
  })

  return texts
}

function applyTranslation(word: WordEntry, pathStr: string, translation: string): void {
  const parts = pathStr.split('.')
  let obj: any = word
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i]
    const idx = parseInt(key)
    obj = isNaN(idx) ? obj[key] : obj[idx]
  }
  const lastKey = parts[parts.length - 1]
  
  // Save source before overwriting
  if (lastKey === 'cn') {
    obj['cn_source'] = obj[lastKey]
  } else if (lastKey === 't' || lastKey === 'd') {
    obj[`${lastKey}_source`] = obj[lastKey]
  }
  
  obj[lastKey] = translation
}

async function translateDictionary(
  filePath: string,
  useGemini: boolean
): Promise<{ stats: TranslationStats; errors: string[] }> {
  const raw = fs.readFileSync(filePath, 'utf-8')
  const words: WordEntry[] = JSON.parse(raw)
  const stats: TranslationStats = {
    totalFields: 0,
    translatedByGemini: 0,
    translatedByRules: 0,
    preserved: 0,
    failed: 0,
  }
  const errors: string[] = []

  // Translate POS labels in trans[] (rule-based, always)
  for (const word of words) {
    if (word.trans) {
      for (const t of word.trans) {
        if (t.pos && containsChinese(t.pos)) {
          t.pos = translatePos(t.pos)
        }
      }
    }
    if (word.synos) {
      for (const s of word.synos) {
        if (s.pos && containsChinese(s.pos)) {
          s.pos = translatePos(s.pos)
        }
      }
    }
  }

  if (useGemini) {
    // Batch all Chinese texts across all words for Gemini translation
    const allTexts: { wordIdx: number; path: string; text: string; globalIdx: number }[] = []
    let globalIdx = 0
    
    for (let wi = 0; wi < words.length; wi++) {
      const chTexts = collectChineseTexts(words[wi])
      for (const ct of chTexts) {
        allTexts.push({ wordIdx: wi, path: ct.path, text: ct.text, globalIdx })
        globalIdx++
      }
    }
    
    stats.totalFields = allTexts.length
    console.log(`      ${allTexts.length} Chinese text fields to translate`)

    // Process in batches
    for (let batchStart = 0; batchStart < allTexts.length; batchStart += BATCH_SIZE) {
      const batch = allTexts.slice(batchStart, batchStart + BATCH_SIZE)
      const batchTexts = batch.map(t => ({ index: t.globalIdx, zh: t.text }))
      
      const translations = await translateBatchWithGemini(batchTexts)
      
      // Apply translations
      const translationMap = new Map(translations.map(t => [t.index, t.vi]))
      
      for (const item of batch) {
        const vi = translationMap.get(item.globalIdx)
        if (vi && vi.trim()) {
          applyTranslation(words[item.wordIdx], item.path, vi)
          stats.translatedByGemini++
        } else {
          // Keep original Chinese, mark as not translated
          stats.failed++
          if (errors.length < 20) {
            errors.push(`${words[item.wordIdx].word}:${item.path}`)
          }
        }
      }

      if (batchStart + BATCH_SIZE < allTexts.length) {
        await new Promise(r => setTimeout(r, API_DELAY_MS))
      }
      
      // Progress
      const done = Math.min(batchStart + BATCH_SIZE, allTexts.length)
      process.stdout.write(`\r      Translated: ${done}/${allTexts.length} fields`)
    }
    console.log() // newline after progress
  } else {
    // Rule-based only: preserve Chinese with cn_source marker
    for (const word of words) {
      const chTexts = collectChineseTexts(word)
      stats.totalFields += chTexts.length
      
      for (const ct of chTexts) {
        // For cn fields, save source and keep as-is (no translation without API)
        // The cn_source allows future translation passes
        const parts = ct.path.split('.')
        let obj: any = word
        for (let i = 0; i < parts.length - 1; i++) {
          const key = parts[i]
          const idx = parseInt(key)
          obj = isNaN(idx) ? obj[key] : obj[idx]
        }
        const lastKey = parts[parts.length - 1]
        
        if (lastKey === 'cn') {
          obj['cn_source'] = obj[lastKey]
        } else if (lastKey === 't' || lastKey === 'd') {
          obj[`${lastKey}_source`] = obj[lastKey]
        }
        stats.preserved++
      }
    }
  }

  // Write translated file
  fs.writeFileSync(filePath, JSON.stringify(words, null, 0), 'utf-8')
  
  return { stats, errors }
}

// --- Main ---
async function main() {
  const args = process.argv.slice(2)
  const singleFile = args.find((_, i) => args[i - 1] === '--file')
  const useGemini = !!GEMINI_API_KEY
  
  console.log('[TRANSLATE] TypeWords zh-CN → Vietnamese Translation')
  console.log(`   Translation engine: ${useGemini ? 'Gemini API (' + GEMINI_MODEL + ')' : 'Rule-based (POS labels only)'}`)
  console.log()

  if (!useGemini) {
    console.log('[TIP] For full translation, set GEMINI_API_KEY environment variable.')
    console.log('   Without it, only POS labels are translated; Chinese content is preserved with cn_source markers.')
    console.log()
  }

  // Load inventory
  if (!fs.existsSync(INVENTORY_PATH)) {
    console.error('[FAIL] Inventory not found. Run discover-source.ts first.')
    process.exit(1)
  }
  
  const inventory = JSON.parse(fs.readFileSync(INVENTORY_PATH, 'utf-8'))
  let filesToProcess: { id: string; url: string; name: string }[]

  if (singleFile) {
    filesToProcess = inventory.filter((e: any) => e.url === singleFile)
    if (filesToProcess.length === 0) {
      console.error(`[FAIL] File ${singleFile} not found in inventory`)
      process.exit(1)
    }
  } else {
    filesToProcess = inventory
  }

  fs.mkdirSync(CHECKPOINT_DIR, { recursive: true })

  const totalStats: TranslationStats = {
    totalFields: 0,
    translatedByGemini: 0,
    translatedByRules: 0,
    preserved: 0,
    failed: 0,
  }
  const allErrors: { dict: string; errors: string[] }[] = []
  let processed = 0

  for (const entry of filesToProcess) {
    const filePath = path.resolve(DICT_DIR, entry.url)
    const checkpointPath = path.resolve(CHECKPOINT_DIR, `${entry.url}.done`)
    
    if (fs.existsSync(checkpointPath) && !singleFile) {
      console.log(`⏭️  [${++processed}/${filesToProcess.length}] ${entry.name} — already translated`)
      continue
    }
    
    if (!fs.existsSync(filePath)) {
      console.log(`[FAIL] [${++processed}/${filesToProcess.length}] ${entry.name} — file not found`)
      continue
    }

    console.log(`[RECORD] [${++processed}/${filesToProcess.length}] ${entry.name}`)
    
    try {
      const { stats, errors } = await translateDictionary(filePath, useGemini)
      
      totalStats.totalFields += stats.totalFields
      totalStats.translatedByGemini += stats.translatedByGemini
      totalStats.translatedByRules += stats.translatedByRules
      totalStats.preserved += stats.preserved
      totalStats.failed += stats.failed
      
      if (errors.length > 0) {
        allErrors.push({ dict: entry.name, errors })
      }
      
      // Write checkpoint
      fs.writeFileSync(checkpointPath, new Date().toISOString(), 'utf-8')
      
      console.log(`   [OK] ${stats.totalFields} fields | Gemini: ${stats.translatedByGemini} | Rules: ${stats.translatedByRules} | Preserved: ${stats.preserved} | Failed: ${stats.failed}`)
    } catch (err: any) {
      console.error(`   [FAIL] Error: ${err.message}`)
      allErrors.push({ dict: entry.name, errors: [err.message] })
    }
  }

  // Summary
  console.log()
  console.log('[SUMMARY] Translation Summary:')
  console.log(`   Total Chinese fields:  ${totalStats.totalFields.toLocaleString()}`)
  console.log(`   Translated (Gemini):   ${totalStats.translatedByGemini.toLocaleString()}`)
  console.log(`   Translated (Rules):    ${totalStats.translatedByRules.toLocaleString()}`)
  console.log(`   Preserved (cn_source): ${totalStats.preserved.toLocaleString()}`)
  console.log(`   Failed:                ${totalStats.failed.toLocaleString()}`)

  // Write report
  fs.writeFileSync(REPORT_PATH, JSON.stringify({
    timestamp: new Date().toISOString(),
    engine: useGemini ? `gemini:${GEMINI_MODEL}` : 'rule-based',
    stats: totalStats,
    errors: allErrors,
  }, null, 2), 'utf-8')
  console.log(`   Report: ${REPORT_PATH}`)
}

main().catch(err => {
  console.error('[FAIL] Fatal error:', err)
  process.exit(1)
})
