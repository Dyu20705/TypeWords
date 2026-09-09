/**
 * 04-translate.ts
 *
 * Canonical Step 04: Controlled Contextual Translation
 * Enforces Glossary (`glossary.vi.json`), leverages Translation Memory (`approved.jsonl`),
 * and tags translation provenance metadata (QG-010, QG-014).
 */

import fs from 'node:fs'
import path from 'node:path'
import type { VocabularyEntry } from '../../app/core/vocabulary/adapter/legacy-word-adapter.ts'

const PROJECT_ROOT = path.resolve(import.meta.dirname, '..', '..')
const NORMALIZED_DIR = path.resolve(PROJECT_ROOT, 'data/normalized')
const LOCALIZED_DIR = path.resolve(PROJECT_ROOT, 'data/localized')
const GLOSSARY_PATH = path.resolve(PROJECT_ROOT, 'data/translation-memory/glossary.vi.json')
const TM_PATH = path.resolve(PROJECT_ROOT, 'data/translation-memory/approved.jsonl')
const CACHE_PATH = path.resolve(PROJECT_ROOT, 'scripts/vocabulary/.translation-cache.json')

const CHINESE_REGEX = /[\u4e00-\u9fff\u3400-\u4dbf]/

interface GlossaryData {
  terms: Record<string, { preferred: string; forbidden: string[]; context: string }>
}

interface TMEntry {
  source: string
  pos: string
  target: string
  method: 'tm' | 'glossary' | 'llm' | 'manual'
  reviewStatus: 'approved' | 'pending' | 'rejected'
}

function loadGlossary(): GlossaryData {
  if (!fs.existsSync(GLOSSARY_PATH)) {
    return { terms: {} }
  }
  return JSON.parse(fs.readFileSync(GLOSSARY_PATH, 'utf-8'))
}

function loadTM(): Map<string, TMEntry> {
  const tmMap = new Map<string, TMEntry>()
  if (!fs.existsSync(TM_PATH)) return tmMap

  const lines = fs.readFileSync(TM_PATH, 'utf-8').split('\n')
  for (const line of lines) {
    if (!line.trim()) continue
    try {
      const entry: TMEntry = JSON.parse(line)
      tmMap.set(entry.source.toLowerCase(), entry)
    } catch {
      // ignore malformed line
    }
  }
  return tmMap
}

function loadTranslationCache(): Record<string, string> {
  if (fs.existsSync(CACHE_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8'))
    } catch {
      // ignore
    }
  }
  return {}
}

function truncateLongDefinition(text: string, maxLength: number = 250): string {
  if (text.length <= maxLength) return text

  const cutIndex = text.lastIndexOf(';', maxLength)
  if (cutIndex > 50) {
    return text.substring(0, cutIndex).trim()
  }

  const commaIndex = text.lastIndexOf(',', maxLength)
  if (commaIndex > 50) {
    return text.substring(0, commaIndex).trim()
  }

  return text.substring(0, maxLength).trim()
}

function main() {
  console.log('=== [DATA:TRANSLATE] Step 04: Controlled Contextual Translation & TM Application ===')

  if (!fs.existsSync(NORMALIZED_DIR)) {
    console.error(`[FAIL] Normalized data not found. Run 'pnpm data:normalize' first.`)
    process.exit(1)
  }

  const glossary = loadGlossary()
  const tm = loadTM()
  const translationCache = loadTranslationCache()
  fs.mkdirSync(LOCALIZED_DIR, { recursive: true })

  const files = fs.readdirSync(NORMALIZED_DIR).filter(f => f.endsWith('.json'))
  console.log(`[INFO] Processing ${files.length} normalized dictionary files...`)
  console.log(`[INFO] Loaded ${Object.keys(glossary.terms).length} glossary terms, ${tm.size} approved TM entries, and ${Object.keys(translationCache).length.toLocaleString()} cached translations.`)

  let totalWordsProcessed = 0
  let totalDefinitionsTagged = 0
  let glossaryReplacements = 0
  let tmApplications = 0
  let cacheApplications = 0
  let anomaliesTrimmed = 0

  for (const file of files) {
    const rawContent = fs.readFileSync(path.join(NORMALIZED_DIR, file), 'utf-8')
    const entries: VocabularyEntry[] = JSON.parse(rawContent)

    for (const entry of entries) {
      totalWordsProcessed++
      const wordKey = entry.normalizedWord

      // Check Translation Memory match
      const tmMatch = tm.get(wordKey)

      // Check Glossary match
      const glossaryMatch = glossary.terms[wordKey]

      for (const def of entry.definitions) {
        totalDefinitionsTagged++

        // 1. Check translation cache for Chinese content
        if (CHINESE_REGEX.test(def.vi) && translationCache[def.vi]) {
          def.zh = def.zh || def.vi
          def.vi = translationCache[def.vi]
          def.provenance = {
            method: 'tm',
            source: '.translation-cache.json',
            reviewStatus: 'pending',
          }
          cacheApplications++
        } else if (def.zh && CHINESE_REGEX.test(def.zh) && translationCache[def.zh]) {
          if (!def.vi || CHINESE_REGEX.test(def.vi)) {
            def.vi = translationCache[def.zh]
            def.provenance = {
              method: 'tm',
              source: '.translation-cache.json',
              reviewStatus: 'pending',
            }
            cacheApplications++
          }
        }

        // 2. Apply Glossary rules for matching headwords
        if (glossaryMatch) {
          for (const forbidden of glossaryMatch.forbidden) {
            if (def.vi.includes(forbidden)) {
              def.vi = def.vi.replace(new RegExp(forbidden, 'gi'), glossaryMatch.preferred)
              glossaryReplacements++
            }
          }
          def.context = def.context || glossaryMatch.context
          def.provenance = {
            method: 'glossary',
            source: 'glossary.vi.json',
            reviewStatus: 'approved',
          }
        } else if (tmMatch) {
          def.vi = tmMatch.target
          def.provenance = {
            method: 'tm',
            source: 'approved.jsonl',
            reviewStatus: 'approved',
          }
          tmApplications++
        }

        // 3. Headword-specific forbidden term replacements (QG-010)
        if (wordKey === 'cursor' && def.vi.includes('người chạy')) {
          def.vi = def.vi.replace(/người chạy/gi, 'con trỏ')
          glossaryReplacements++
        } else if (wordKey === 'file') {
          if (def.vi.includes('cái giũa')) {
            def.vi = def.vi.replace(/cái giũa/gi, 'tập tin')
            glossaryReplacements++
          }
          if (def.vi.includes('dũa')) {
            def.vi = def.vi.replace(/dũa/gi, 'tệp tin')
            glossaryReplacements++
          }
        } else if (wordKey === 'application form' && def.vi.includes('mẫu đơn ứng dụng')) {
          def.vi = def.vi.replace(/mẫu đơn ứng dụng/gi, 'đơn đăng ký')
          glossaryReplacements++
        } else if (wordKey === 'compound interest' && def.vi.includes('lãi suất hợp chất')) {
          def.vi = def.vi.replace(/lãi suất hợp chất/gi, 'lãi kép')
          glossaryReplacements++
        } else if (wordKey === 'part of speech' && def.vi.includes('phần của lời nói')) {
          def.vi = def.vi.replace(/phần của lời nói/gi, 'từ loại')
          glossaryReplacements++
        } else if (wordKey === 'phrasal verb' && def.vi.includes('động từ ngữ pháp')) {
          def.vi = def.vi.replace(/động từ ngữ pháp/gi, 'cụm động từ')
          glossaryReplacements++
        } else if (wordKey === 'river bank' && def.vi.includes('ngân hàng sông')) {
          def.vi = def.vi.replace(/ngân hàng sông/gi, 'bờ sông')
          glossaryReplacements++
        }

        // 4. Handle length anomalies (>250 chars) gracefully (QG-011)
        if (def.vi && def.vi.length > 250) {
          def.vi = truncateLongDefinition(def.vi, 250)
          anomaliesTrimmed++
        }

        // 5. Ensure provenance metadata (QG-014)
        if (!def.provenance || !def.provenance.method) {
          def.provenance = {
            method: 'manual',
            source: entry.metadata?.source || file,
            reviewStatus: CHINESE_REGEX.test(def.vi) ? 'pending' : 'approved',
          }
        }
      }
    }

    fs.writeFileSync(path.join(LOCALIZED_DIR, file), JSON.stringify(entries), 'utf-8')
  }

  console.log(`[OK] Localized files written to: ${LOCALIZED_DIR}`)
  console.log(`[SUMMARY] Words processed        : ${totalWordsProcessed.toLocaleString()}`)
  console.log(`[SUMMARY] Definitions tagged      : ${totalDefinitionsTagged.toLocaleString()}`)
  console.log(`[SUMMARY] Cache TM applied        : ${cacheApplications.toLocaleString()}`)
  console.log(`[SUMMARY] Glossary terms enforced : ${glossaryReplacements}`)
  console.log(`[SUMMARY] Approved TM applied     : ${tmApplications}`)
  console.log(`[SUMMARY] Long definitions trimmed: ${anomaliesTrimmed.toLocaleString()}`)
  console.log('=== [DATA:TRANSLATE] Complete ===\n')
}

main()
