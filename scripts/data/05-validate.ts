/**
 * 05-validate.ts
 *
 * Canonical Step 05: 3-Tier Quality Gates Runner (Validation Gates)
 * Enforces:
 *   Tier 1: Structural QA (QG-001, QG-002, QG-003, QG-004)
 *   Tier 2: Linguistic QA (QG-005, QG-006, QG-007, QG-010, QG-011, QG-012, QG-013, QG-014)
 *   Tier 3: Catalog Parity QA (QG-016)
 *
 * Note: QG-015 (Checksums) and QG-017 (Staged Publish) are Publish Gates executed during `data:publish`.
 * Outputs: `data/manifests/quality-report.json`.
 */

import fs from 'node:fs'
import path from 'node:path'
import type { VocabularyEntry } from '../../app/core/vocabulary/adapter/legacy-word-adapter.ts'

const PROJECT_ROOT = path.resolve(import.meta.dirname, '..', '..')
const LOCALIZED_DIR = path.resolve(PROJECT_ROOT, 'data/localized')
const RAW_DIR = path.resolve(PROJECT_ROOT, 'data/sources/raw')
const RUNTIME_DIR = path.resolve(PROJECT_ROOT, 'public/dicts/en/word')
const CATALOG_PATH = path.resolve(PROJECT_ROOT, 'data/sources/catalogs/production-catalog.json')
const ACCOUNTING_PATH = path.resolve(PROJECT_ROOT, 'data/manifests/source-accounting.json')
const GLOSSARY_PATH = path.resolve(PROJECT_ROOT, 'data/translation-memory/glossary.vi.json')
const REPORT_PATH = path.resolve(PROJECT_ROOT, 'data/manifests/quality-report.json')

const CHINESE_REGEX = /[\u4e00-\u9fff\u3400-\u4dbf]/

const KNOWN_POS_SET = new Set([
  'n.', 'v.', 'vt.', 'vi.', 'adj.', 'a.', 'adv.', 'prep.', 'conj.',
  'pron.', 'num.', 'art.', 'interj.', 'd.', 'đg.', 'ngđ.', 'nđ.',
  'tt.', 'abbr.', 'tên riêng', 'phrase', 'idiom', 'aux.', 'modal',
  'det.', 'int.', 'sym.', 'danh từ', 'động từ', 'tính từ', 'trạng từ',
  'giới từ', 'liên từ', 'đại từ', 'số từ', 'mạo từ', 'thán từ', 'viết tắt',
  'trợ từ'
])

export interface GateResult {
  code: string
  name: string
  tier: 'Structural' | 'Linguistic' | 'Catalog'
  passed: boolean
  details: string
  metric?: string | number
  gateType?: 'Validation' | 'Publish' | 'Audit'
}

/**
 * Validates an entry against all constraints of data/schemas/vocabulary-entry.schema.json
 */
export function validateVocabularyEntrySchema(entry: any): string[] {
  const errors: string[] = []
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    return ['Entry is not a non-null object']
  }

  // Required properties: id, word, normalizedWord, definitions
  if (entry.id === undefined || entry.id === null || entry.id === '') {
    errors.push('Missing or empty required field: id')
  } else if (typeof entry.id !== 'string' && typeof entry.id !== 'number') {
    errors.push(`Field id must be string or number, got: ${typeof entry.id}`)
  }

  if (typeof entry.word !== 'string' || entry.word.trim().length === 0) {
    errors.push('Field word must be non-empty string')
  }

  if (typeof entry.normalizedWord !== 'string' || entry.normalizedWord.trim().length === 0) {
    errors.push('Field normalizedWord must be non-empty string')
  }

  // phonetic: optional object with uk, us strings
  if (entry.phonetic !== undefined) {
    if (typeof entry.phonetic !== 'object' || entry.phonetic === null || Array.isArray(entry.phonetic)) {
      errors.push('Field phonetic must be an object if present')
    } else {
      if (entry.phonetic.uk !== undefined && typeof entry.phonetic.uk !== 'string') {
        errors.push('Field phonetic.uk must be a string')
      }
      if (entry.phonetic.us !== undefined && typeof entry.phonetic.us !== 'string') {
        errors.push('Field phonetic.us must be a string')
      }
    }
  }

  // definitions: array with minItems 1
  if (!Array.isArray(entry.definitions) || entry.definitions.length === 0) {
    errors.push('Field definitions must be an array with at least 1 item')
  } else {
    for (let i = 0; i < entry.definitions.length; i++) {
      const def = entry.definitions[i]
      if (!def || typeof def !== 'object' || Array.isArray(def)) {
        errors.push(`definitions[${i}] must be an object`)
        continue
      }
      if (typeof def.pos !== 'string') {
        errors.push(`definitions[${i}].pos must be a string`)
      }
      if (typeof def.vi !== 'string' || def.vi.trim().length === 0) {
        errors.push(`definitions[${i}].vi must be a non-empty string`)
      }
      if (def.en !== undefined && typeof def.en !== 'string') {
        errors.push(`definitions[${i}].en must be a string`)
      }
      if (def.zh !== undefined && typeof def.zh !== 'string') {
        errors.push(`definitions[${i}].zh must be a string`)
      }
      if (def.context !== undefined && typeof def.context !== 'string') {
        errors.push(`definitions[${i}].context must be a string`)
      }
      if (def.provenance !== undefined) {
        if (typeof def.provenance !== 'object' || def.provenance === null) {
          errors.push(`definitions[${i}].provenance must be an object`)
        } else {
          const validMethods = ['tm', 'glossary', 'llm', 'manual']
          if (def.provenance.method && !validMethods.includes(def.provenance.method)) {
            errors.push(`definitions[${i}].provenance.method invalid: ${def.provenance.method}`)
          }
          const validStatus = ['approved', 'pending', 'rejected']
          if (def.provenance.reviewStatus && !validStatus.includes(def.provenance.reviewStatus)) {
            errors.push(`definitions[${i}].provenance.reviewStatus invalid: ${def.provenance.reviewStatus}`)
          }
        }
      }
    }
  }

  // examples: optional array of objects with en (minLength 1)
  if (entry.examples !== undefined) {
    if (!Array.isArray(entry.examples)) {
      errors.push('Field examples must be an array')
    } else {
      for (let i = 0; i < entry.examples.length; i++) {
        const ex = entry.examples[i]
        if (!ex || typeof ex !== 'object' || typeof ex.en !== 'string' || ex.en.trim().length === 0) {
          errors.push(`examples[${i}] must be an object with non-empty string en`)
        }
      }
    }
  }

  // phrases: optional array of objects with phrase (minLength 1)
  if (entry.phrases !== undefined) {
    if (!Array.isArray(entry.phrases)) {
      errors.push('Field phrases must be an array')
    } else {
      for (let i = 0; i < entry.phrases.length; i++) {
        const ph = entry.phrases[i]
        if (!ph || typeof ph !== 'object' || typeof ph.phrase !== 'string' || ph.phrase.trim().length === 0) {
          errors.push(`phrases[${i}] must be an object with non-empty string phrase`)
        }
      }
    }
  }

  // synonyms: optional array of objects with required pos and words array
  if (entry.synonyms !== undefined) {
    if (!Array.isArray(entry.synonyms)) {
      errors.push('Field synonyms must be an array')
    } else {
      for (let i = 0; i < entry.synonyms.length; i++) {
        const syn = entry.synonyms[i]
        if (!syn || typeof syn !== 'object' || typeof syn.pos !== 'string' || !Array.isArray(syn.words)) {
          errors.push(`synonyms[${i}] must have string pos and array words`)
        }
      }
    }
  }

  return errors
}

export interface ValidationConfig {
  localizedDir?: string
  rawDir?: string
  runtimeDir?: string
  catalogPath?: string
  accountingPath?: string
  glossaryPath?: string
  reportPath?: string
  silent?: boolean
}

export function runValidationGates(config: ValidationConfig = {}): { results: GateResult[]; allPassed: boolean } {
  const localizedDir = config.localizedDir || LOCALIZED_DIR
  const rawDir = config.rawDir || RAW_DIR
  const runtimeDir = config.runtimeDir || RUNTIME_DIR
  const catalogPath = config.catalogPath || CATALOG_PATH
  const accountingPath = config.accountingPath || ACCOUNTING_PATH
  const glossaryPath = config.glossaryPath || GLOSSARY_PATH
  const reportPath = config.reportPath !== undefined ? config.reportPath : REPORT_PATH
  const silent = config.silent ?? false

  if (!fs.existsSync(localizedDir)) {
    throw new Error(`Localized data directory not found: ${localizedDir}`)
  }

  const localizedFiles = fs.readdirSync(localizedDir).filter(f => f.endsWith('.json'))
  if (!silent) {
    console.log(`[INFO] Validating ${localizedFiles.length} localized dictionary datasets...`)
  }

  let totalWords = 0
  let totalDefinitions = 0
  let emptyDefinitionsCount = 0
  let chineseLeakageInViCount = 0
  let duplicateWordsCount = 0
  let missingRequiredFieldsCount = 0
  let schemaViolationsCount = 0
  let glossaryViolationsCount = 0
  let anomaliesCount = 0
  let missingProvenanceCount = 0
  let validDefinitionsCount = 0
  let recognizedPosCount = 0
  let contextTaggedCount = 0

  // Load glossary for QG-010
  const glossaryTerms: Record<string, any> = {}
  if (fs.existsSync(glossaryPath)) {
    const glossary = JSON.parse(fs.readFileSync(glossaryPath, 'utf-8'))
    Object.assign(glossaryTerms, glossary.terms || {})
  }

  // 1. Iterate localized files and entries
  for (const file of localizedFiles) {
    const filePath = path.join(localizedDir, file)
    const entries: VocabularyEntry[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

    const seenInFile = new Set<string>()

    for (const entry of entries) {
      totalWords++

      // QG-001: Strict Schema Validation
      const schemaErrors = validateVocabularyEntrySchema(entry)
      if (schemaErrors.length > 0) {
        schemaViolationsCount++
      }

      // QG-002: Required fields validation
      const hasValidId = entry.id !== undefined && entry.id !== null && entry.id !== ''
      const hasWord = typeof entry.word === 'string' && entry.word.trim().length > 0
      const hasNorm = typeof entry.normalizedWord === 'string' && entry.normalizedWord.trim().length > 0
      const hasDefs = Array.isArray(entry.definitions) && entry.definitions.length > 0
      if (!hasValidId || !hasWord || !hasNorm || !hasDefs) {
        missingRequiredFieldsCount++
      }

      // QG-003: Unique word IDs (normalized) per dictionary file
      if (seenInFile.has(entry.normalizedWord)) {
        duplicateWordsCount++
      } else {
        seenInFile.add(entry.normalizedWord)
      }

      for (const def of entry.definitions || []) {
        totalDefinitions++

        // QG-005 & QG-006: Translation presence and non-emptiness
        if (!def.vi || def.vi.trim().length === 0) {
          emptyDefinitionsCount++
        } else {
          validDefinitionsCount++
        }

        // QG-007: ZERO Chinese leakage in Vietnamese fields
        // Note: def.zh is preserved source Chinese, NOT counted as leakage
        if (CHINESE_REGEX.test(def.vi || '')) {
          chineseLeakageInViCount++
        }

        // QG-011: Anomaly detection (> 250 chars)
        if (def.vi && def.vi.length > 250) {
          anomaliesCount++
        }

        // QG-012: POS consistency
        if (def.pos) {
          const normalizedPos = def.pos.trim().toLowerCase()
          if (KNOWN_POS_SET.has(normalizedPos) || KNOWN_POS_SET.has(def.pos.trim())) {
            recognizedPosCount++
          }
        }

        // QG-013: Domain context tagging
        if (def.context && def.context.trim().length > 0) {
          contextTaggedCount++
        }

        // QG-014: Translation provenance tagging
        if (!def.provenance || !def.provenance.method || !def.provenance.reviewStatus) {
          missingProvenanceCount++
        }
      }

      // Check secondary Vietnamese fields for Chinese leakage (QG-007)
      for (const ex of entry.examples || []) {
        if (ex.vi && CHINESE_REGEX.test(ex.vi)) {
          chineseLeakageInViCount++
        }
      }
      for (const ph of entry.phrases || []) {
        if (ph.vi && CHINESE_REGEX.test(ph.vi)) {
          chineseLeakageInViCount++
        }
      }
      for (const syn of entry.synonyms || []) {
        if (syn.vi && CHINESE_REGEX.test(syn.vi)) {
          chineseLeakageInViCount++
        }
      }

      // QG-010: Glossary compliance on defined headwords
      const glossaryRule = glossaryTerms[entry.normalizedWord]
      if (glossaryRule && glossaryRule.forbidden && Array.isArray(glossaryRule.forbidden)) {
        for (const def of entry.definitions || []) {
          for (const forbidden of glossaryRule.forbidden) {
            if (def.vi && def.vi.includes(forbidden)) {
              glossaryViolationsCount++
            }
          }
        }
      }
    }
  }

  // 2. QG-004: Recompute Source Accounting independently from source data
  let qg004Passed = false
  let accountingDiscrepancies = 0
  let accountingSummary = ''

  if (fs.existsSync(accountingPath)) {
    const manifestAccounting: any[] = JSON.parse(fs.readFileSync(accountingPath, 'utf-8'))
    const manifestMap = new Map(manifestAccounting.map(a => [a.dictionary, a]))

    for (const file of localizedFiles) {
      const rawPath = fs.existsSync(path.join(rawDir, file))
        ? path.join(rawDir, file)
        : path.join(runtimeDir, file)

      if (!fs.existsSync(rawPath)) {
        accountingDiscrepancies++
        continue
      }

      const rawList: any[] = JSON.parse(fs.readFileSync(rawPath, 'utf-8'))
      const sourceCount = rawList.length

      const seenWords = new Map<string, number>()
      let recomputedRejected = 0
      let recomputedAccepted = 0

      for (let i = 0; i < rawList.length; i++) {
        const raw = rawList[i]
        if (!raw || typeof raw !== 'object') {
          recomputedRejected++
          continue
        }
        const wordStr = String(raw.word || '').trim()
        if (!wordStr) {
          recomputedRejected++
          continue
        }
        const normWord = wordStr.toLowerCase()
        if (seenWords.has(normWord)) {
          seenWords.set(normWord, seenWords.get(normWord)! + 1)
          continue
        }
        seenWords.set(normWord, 1)

        const validTrans = (raw.trans || []).filter((t: any) => {
          if (!t || typeof t !== 'object') return false
          const cn = typeof t.cn === 'string' ? t.cn.trim() : ''
          const cn_source = typeof t.cn_source === 'string' ? t.cn_source.trim() : ''
          return cn.length > 0 || cn_source.length > 0
        })

        if (validTrans.length === 0) {
          recomputedRejected++
          continue
        }

        recomputedAccepted++
      }

      let recomputedDeduped = 0
      for (const count of seenWords.values()) {
        if (count > 1) {
          recomputedDeduped += (count - 1)
        }
      }

      // Verify recomputed balance
      const recomputedBalanced = sourceCount === (recomputedAccepted + recomputedRejected + recomputedDeduped)
      if (!recomputedBalanced) {
        accountingDiscrepancies++
      }

      // Verify match with manifest
      const manifestEntry = manifestMap.get(file)
      if (!manifestEntry) {
        accountingDiscrepancies++
      } else {
        if (
          manifestEntry.sourceCount !== sourceCount ||
          manifestEntry.acceptedCount !== recomputedAccepted ||
          manifestEntry.rejectedCount !== recomputedRejected ||
          manifestEntry.deduplicatedCount !== recomputedDeduped ||
          manifestEntry.isBalanced !== true
        ) {
          accountingDiscrepancies++
        }
      }
    }

    qg004Passed = accountingDiscrepancies === 0 && manifestAccounting.length === localizedFiles.length
    accountingSummary = `${localizedFiles.length - accountingDiscrepancies}/${localizedFiles.length} dictionaries independently recomputed and verified`
  } else {
    accountingSummary = 'Source accounting manifest missing'
  }

  // 3. QG-005: Translation coverage calculation (Presence & non-emptiness of vi)
  const coverageRate = totalDefinitions > 0 ? (validDefinitionsCount / totalDefinitions) * 100 : 0
  const qg005Passed = coverageRate >= 99.8

  // 4. QG-012: POS consistency rate
  const posConsistencyRate = totalDefinitions > 0 ? (recognizedPosCount / totalDefinitions) * 100 : 0
  const qg012Passed = posConsistencyRate >= 95.0

  // 5. QG-016: Exact Manifest Parity (Catalog vs Localized Dataset Identity)
  let qg016Passed = false
  let parityDetails = ''
  let missingFiles: string[] = []
  let unexpectedFiles: string[] = []
  let duplicateCatalogUrls: string[] = []

  if (fs.existsSync(catalogPath)) {
    const catalog: any[] = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'))
    const catalogUrls: string[] = []
    const seenCatalogUrls = new Set<string>()

    for (const c of catalog) {
      if (seenCatalogUrls.has(c.url)) {
        duplicateCatalogUrls.push(c.url)
      } else {
        seenCatalogUrls.add(c.url)
        catalogUrls.push(c.url)
      }
    }

    const localizedSet = new Set(localizedFiles)
    missingFiles = catalogUrls.filter(url => !localizedSet.has(url))
    unexpectedFiles = localizedFiles.filter(f => !seenCatalogUrls.has(f))

    qg016Passed = duplicateCatalogUrls.length === 0 && missingFiles.length === 0 && unexpectedFiles.length === 0
    if (qg016Passed) {
      parityDetails = `Exact identity match: ${catalogUrls.length}/${catalogUrls.length} files aligned, 0 missing, 0 unexpected, 0 duplicates`
    } else {
      parityDetails = `Parity mismatch: ${missingFiles.length} missing, ${unexpectedFiles.length} unexpected, ${duplicateCatalogUrls.length} catalog duplicates`
    }
  } else {
    parityDetails = 'Catalog file missing'
  }

  // 6. Compile Results with Real Enforcement (Zero Hardcoded Passes)
  const results: GateResult[] = [
    // Tier 1: Structural QA
    {
      code: 'QG-001',
      name: 'JSON Schema Validation (All Constraints)',
      tier: 'Structural',
      gateType: 'Validation',
      passed: schemaViolationsCount === 0,
      details: schemaViolationsCount === 0
        ? '100% entries strictly adhere to vocabulary-entry.schema.json'
        : `${schemaViolationsCount} entries violated schema constraints`,
      metric: `${schemaViolationsCount} violations`,
    },
    {
      code: 'QG-002',
      name: 'Required Fields (id, word, normalizedWord, definitions)',
      tier: 'Structural',
      gateType: 'Validation',
      passed: missingRequiredFieldsCount === 0,
      details: missingRequiredFieldsCount === 0
        ? '0 missing required fields (phonetic is optional per canonical schema)'
        : `${missingRequiredFieldsCount} entries missing required fields`,
      metric: `${totalWords.toLocaleString()} entries verified`,
    },
    {
      code: 'QG-003',
      name: 'Unique Word IDs Per Dictionary',
      tier: 'Structural',
      gateType: 'Validation',
      passed: duplicateWordsCount === 0,
      details: duplicateWordsCount === 0
        ? '0 duplicate headwords within files'
        : `${duplicateWordsCount} duplicates found within dictionaries`,
      metric: duplicateWordsCount,
    },
    {
      code: 'QG-004',
      name: 'Recomputed Source Accounting Integrity',
      tier: 'Structural',
      gateType: 'Validation',
      passed: qg004Passed,
      details: accountingSummary,
      metric: `${accountingDiscrepancies} discrepancies`,
    },

    // Tier 2: Linguistic QA
    {
      code: 'QG-005',
      name: 'Translation Coverage (Presence & Non-Emptiness)',
      tier: 'Linguistic',
      gateType: 'Validation',
      passed: qg005Passed,
      details: `Coverage rate: ${coverageRate.toFixed(2)}% (Target >= 99.8%; measures translation presence, not correctness)`,
      metric: `${coverageRate.toFixed(2)}%`,
    },
    {
      code: 'QG-006',
      name: 'No Empty Definitions',
      tier: 'Linguistic',
      gateType: 'Validation',
      passed: emptyDefinitionsCount === 0,
      details: emptyDefinitionsCount === 0
        ? '0 empty or whitespace-only definitions'
        : `${emptyDefinitionsCount} empty definitions detected`,
      metric: emptyDefinitionsCount,
    },
    {
      code: 'QG-007',
      name: 'No Chinese Character Leakage in Vietnamese Fields',
      tier: 'Linguistic',
      gateType: 'Validation',
      passed: chineseLeakageInViCount === 0,
      details: chineseLeakageInViCount === 0
        ? '0 Chinese characters found in Vietnamese fields (def.zh preserved separately)'
        : `${chineseLeakageInViCount} Chinese characters leaked in definitions[].vi`,
      metric: chineseLeakageInViCount,
    },
    {
      code: 'QG-010',
      name: 'Glossary Compliance & Forbidden Term Detection',
      tier: 'Linguistic',
      gateType: 'Validation',
      passed: glossaryViolationsCount === 0,
      details: glossaryViolationsCount === 0
        ? '0 forbidden translations found in glossary terms'
        : `${glossaryViolationsCount} forbidden terms found`,
      metric: glossaryViolationsCount,
    },
    {
      code: 'QG-011',
      name: 'Translation Anomaly Detection (Length <= 250 chars)',
      tier: 'Linguistic',
      gateType: 'Validation',
      passed: anomaliesCount === 0,
      details: anomaliesCount === 0
        ? '0 length anomalies detected (>250 chars)'
        : `${anomaliesCount} definitions exceeded 250 characters`,
      metric: anomaliesCount,
    },
    {
      code: 'QG-012',
      name: 'Part-of-Speech (POS) Consistency',
      tier: 'Linguistic',
      gateType: 'Validation',
      passed: qg012Passed,
      details: `POS consistency rate: ${posConsistencyRate.toFixed(2)}% (Target >= 95.0%)`,
      metric: `${posConsistencyRate.toFixed(2)}%`,
    },
    {
      code: 'QG-013',
      name: 'Sense Disambiguation & Domain Context Audit',
      tier: 'Linguistic',
      gateType: 'Audit',
      passed: contextTaggedCount > 0,
      details: `${contextTaggedCount.toLocaleString()} definitions tagged with specialized domain context`,
      metric: contextTaggedCount,
    },
    {
      code: 'QG-014',
      name: 'Translation Provenance & Review Status Tagging',
      tier: 'Linguistic',
      gateType: 'Validation',
      passed: missingProvenanceCount === 0,
      details: missingProvenanceCount === 0
        ? '100% definitions contain provenance metadata (method & reviewStatus)'
        : `${missingProvenanceCount} definitions missing provenance`,
      metric: missingProvenanceCount,
    },

    // Tier 3: Catalog Parity QA
    {
      code: 'QG-016',
      name: 'Exact Manifest Parity (Catalog vs Localized Dataset)',
      tier: 'Catalog',
      gateType: 'Validation',
      passed: qg016Passed,
      details: parityDetails,
      metric: `${missingFiles.length} missing, ${unexpectedFiles.length} unexpected`,
    },
  ]

  if (reportPath) {
    fs.mkdirSync(path.dirname(reportPath), { recursive: true })
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      executionModel: 'ValidationGatesOnly (PublishGates QG-015/017 run in data:publish)',
      results,
    }, null, 2), 'utf-8')
  }

  let allPassed = true
  if (!silent) {
    console.log('\n--- 3-Tier Quality Gates Results ---')
  }
  for (const r of results) {
    const status = r.passed ? '[PASS]' : '[FAIL]'
    if (!r.passed) allPassed = false
    if (!silent) {
      console.log(`${status} ${r.code} (${r.tier}) - ${r.name}: ${r.details}`)
    }
  }

  if (!silent && reportPath) {
    console.log(`\n[OK] Quality report saved to: ${reportPath}`)
  }

  return { results, allPassed }
}

export function main() {
  console.log('=== [DATA:VALIDATE] Step 05: Running 3-Tier Quality Gates (Strict Real Enforcement) ===')
  try {
    const { allPassed } = runValidationGates()
    if (!allPassed) {
      console.error(`[FAIL] Quality Gate validation failed. Halting before publish.`)
      process.exit(1)
    }
    console.log(`[SUCCESS] ALL VALIDATION GATES PASSED! Dataset is cleared for data:publish.`)
    console.log('=== [DATA:VALIDATE] Complete ===\n')
  } catch (err: any) {
    console.error(`[FAIL] ${err.message}`)
    process.exit(1)
  }
}

if (process.argv[1]?.endsWith('05-validate.ts')) {
  main()
}

