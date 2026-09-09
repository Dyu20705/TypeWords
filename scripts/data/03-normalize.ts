/**
 * 03-normalize.ts
 *
 * Canonical Step 03: Schema Normalization & Source Accounting (QG-004)
 * Transforms raw dictionary files into canonical `VocabularyEntry` structures.
 * Performs strict source accounting:
 *   sourceCount = acceptedCount + rejectedCount + deduplicatedCount
 */

import fs from 'node:fs'
import path from 'node:path'
import { adaptLegacyWordToVocabularyEntry, type VocabularyEntry } from '../../app/core/vocabulary/adapter/legacy-word-adapter.ts'

const PROJECT_ROOT = path.resolve(import.meta.dirname, '..', '..')
const INVENTORY_PATH = path.resolve(PROJECT_ROOT, 'data/manifests/inventory.json')
const RUNTIME_DIR = path.resolve(PROJECT_ROOT, 'public/dicts/en/word')
const RAW_DIR = path.resolve(PROJECT_ROOT, 'data/sources/raw')
const NORMALIZED_DIR = path.resolve(PROJECT_ROOT, 'data/normalized')
const ACCOUNTING_PATH = path.resolve(PROJECT_ROOT, 'data/manifests/source-accounting.json')

interface InventoryEntry {
  id: string | number
  name: string
  url: string
  length: number
}

interface DictionaryAccounting {
  dictionary: string
  sourceCount: number
  acceptedCount: number
  rejectedCount: number
  deduplicatedCount: number
  isBalanced: boolean
  rejectionDetails: { word: string; reason: string }[]
  deduplicationDetails: { word: string; occurrences: number }[]
}

function main() {
  console.log('=== [DATA:NORMALIZE] Step 03: Normalizing Schemas & Source Accounting ===')

  if (!fs.existsSync(INVENTORY_PATH)) {
    console.error(`[FAIL] Inventory not found. Run 'pnpm data:discover' first.`)
    process.exit(1)
  }

  const inventory: InventoryEntry[] = JSON.parse(fs.readFileSync(INVENTORY_PATH, 'utf-8'))
  fs.mkdirSync(NORMALIZED_DIR, { recursive: true })
  fs.mkdirSync(path.dirname(ACCOUNTING_PATH), { recursive: true })

  const globalAccounting: DictionaryAccounting[] = []
  let totalSourceRecords = 0
  let totalAcceptedRecords = 0
  let totalRejectedRecords = 0
  let totalDeduplicatedRecords = 0

  for (const item of inventory) {
    const filePath = fs.existsSync(path.join(RAW_DIR, item.url))
      ? path.join(RAW_DIR, item.url)
      : path.join(RUNTIME_DIR, item.url)

    if (!fs.existsSync(filePath)) {
      console.warn(`[WARN] Skipping missing dictionary: ${item.url}`)
      continue
    }

    const rawContent = fs.readFileSync(filePath, 'utf-8')
    let rawList: any[] = []
    try {
      rawList = JSON.parse(rawContent)
      if (!Array.isArray(rawList)) {
        throw new Error('Not an array')
      }
    } catch (e: any) {
      console.error(`[ERROR] Malformed JSON in ${item.url}: ${e.message}`)
      continue
    }

    const sourceCount = rawList.length
    totalSourceRecords += sourceCount

    const seenWords = new Map<string, number>()
    const deduplicationDetails: { word: string; occurrences: number }[] = []
    const rejectionDetails: { word: string; reason: string }[] = []
    const acceptedEntries: VocabularyEntry[] = []

    for (let i = 0; i < rawList.length; i++) {
      const raw = rawList[i]
      if (!raw || typeof raw !== 'object') {
        rejectionDetails.push({ word: `index_${i}`, reason: 'Null or non-object entry' })
        continue
      }

      const wordStr = String(raw.word || '').trim()
      if (!wordStr) {
        rejectionDetails.push({ word: `index_${i}`, reason: 'Missing or empty headword' })
        continue
      }

      const normWord = wordStr.toLowerCase()
      if (seenWords.has(normWord)) {
        const count = seenWords.get(normWord)! + 1
        seenWords.set(normWord, count)
        continue
      }
      seenWords.set(normWord, 1)

      // Filter out empty translations from raw.trans (QG-006)
      const validTrans = (raw.trans || []).filter((t: any) => {
        if (!t || typeof t !== 'object') return false
        const cn = typeof t.cn === 'string' ? t.cn.trim() : ''
        const cn_source = typeof t.cn_source === 'string' ? t.cn_source.trim() : ''
        return cn.length > 0 || cn_source.length > 0
      })

      if (validTrans.length === 0) {
        rejectionDetails.push({ word: wordStr, reason: 'Empty or missing definitions' })
        continue
      }

      raw.trans = validTrans

      const entry = adaptLegacyWordToVocabularyEntry(raw, item.name)
      acceptedEntries.push(entry)
    }

    let deduplicatedCount = 0
    for (const [w, count] of seenWords.entries()) {
      if (count > 1) {
        const dupes = count - 1
        deduplicatedCount += dupes
        deduplicationDetails.push({ word: w, occurrences: count })
      }
    }

    const acceptedCount = acceptedEntries.length
    const rejectedCount = rejectionDetails.length
    const isBalanced = sourceCount === (acceptedCount + rejectedCount + deduplicatedCount)

    totalAcceptedRecords += acceptedCount
    totalRejectedRecords += rejectedCount
    totalDeduplicatedRecords += deduplicatedCount

    globalAccounting.push({
      dictionary: item.url,
      sourceCount,
      acceptedCount,
      rejectedCount,
      deduplicatedCount,
      isBalanced,
      rejectionDetails,
      deduplicationDetails,
    })

    const targetPath = path.join(NORMALIZED_DIR, item.url)
    fs.writeFileSync(targetPath, JSON.stringify(acceptedEntries), 'utf-8')
  }

  fs.writeFileSync(ACCOUNTING_PATH, JSON.stringify(globalAccounting, null, 2), 'utf-8')

  console.log(`[OK] Normalized datasets written to: ${NORMALIZED_DIR}`)
  console.log(`[OK] Source Accounting Report written to: ${ACCOUNTING_PATH}`)
  console.log(`[SUMMARY] Total Source Records       : ${totalSourceRecords.toLocaleString()}`)
  console.log(`[SUMMARY] Total Accepted (Normalized): ${totalAcceptedRecords.toLocaleString()}`)
  console.log(`[SUMMARY] Total Deduplicated Records : ${totalDeduplicatedRecords.toLocaleString()}`)
  console.log(`[SUMMARY] Total Rejected Records     : ${totalRejectedRecords.toLocaleString()}`)

  const unbalanced = globalAccounting.filter(a => !a.isBalanced)
  if (unbalanced.length > 0) {
    console.error(`[FAIL] QG-004 Violated: ${unbalanced.length} dictionaries have unbalanced accounting!`)
    process.exit(1)
  }

  console.log(`[SUCCESS] QG-004 Source Accounting: 100% BALANCED across all dictionaries.`)
  console.log('=== [DATA:NORMALIZE] Complete ===\n')
}

main()
