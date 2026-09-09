/**
 * validate-dictionaries.ts
 * 
 * Validates all downloaded dictionary files against the inventory.
 * Checks JSON validity, schema conformance, and record counts.
 */

import fs from 'fs'
import path from 'path'

const INVENTORY_PATH = path.resolve(import.meta.dirname, 'inventory.json')
const PROJECT_ROOT = path.resolve(import.meta.dirname, '..', '..')

interface InventoryEntry {
  id: string
  name: string
  url: string
  length: number
  language: string
  localPath: string
}

interface ValidationResult {
  id: string
  name: string
  url: string
  exists: boolean
  validJson: boolean
  isArray: boolean
  expectedCount: number
  actualCount: number
  countMatch: boolean
  hasRequiredFields: boolean
  missingFields: string[]
  duplicateWords: string[]
  errors: string[]
}

function validateEntry(entry: InventoryEntry): ValidationResult {
  const localAbsPath = path.resolve(PROJECT_ROOT, entry.localPath)
  const result: ValidationResult = {
    id: entry.id,
    name: entry.name,
    url: entry.url,
    exists: false,
    validJson: false,
    isArray: false,
    expectedCount: entry.length,
    actualCount: 0,
    countMatch: false,
    hasRequiredFields: false,
    missingFields: [],
    duplicateWords: [],
    errors: [],
  }

  // Check existence
  if (!fs.existsSync(localAbsPath)) {
    result.errors.push('File does not exist')
    return result
  }
  result.exists = true

  // Check valid JSON
  let data: any
  try {
    const raw = fs.readFileSync(localAbsPath, 'utf-8')
    data = JSON.parse(raw)
    result.validJson = true
  } catch (err: any) {
    result.errors.push(`Invalid JSON: ${err.message}`)
    return result
  }

  // Check array
  if (!Array.isArray(data)) {
    result.errors.push('Data is not an array')
    return result
  }
  result.isArray = true
  result.actualCount = data.length

  // Check count
  result.countMatch = result.actualCount === result.expectedCount
  if (!result.countMatch) {
    result.errors.push(`Count mismatch: expected ${result.expectedCount}, got ${result.actualCount}`)
  }

  // Check required fields on first 5 records
  const requiredFields = ['word']
  const recommendedFields = ['trans', 'phonetic0', 'phonetic1']
  result.hasRequiredFields = true
  
  for (let i = 0; i < Math.min(5, data.length); i++) {
    const record = data[i]
    for (const field of requiredFields) {
      if (!(field in record) || !record[field]) {
        result.hasRequiredFields = false
        if (!result.missingFields.includes(field)) {
          result.missingFields.push(field)
        }
      }
    }
    for (const field of recommendedFields) {
      if (!(field in record)) {
        if (!result.missingFields.includes(`${field} (recommended)`)) {
          result.missingFields.push(`${field} (recommended)`)
        }
      }
    }
  }

  // Check duplicates
  const words = data.map((r: any) => r.word).filter(Boolean)
  const seen = new Set<string>()
  for (const w of words) {
    if (seen.has(w)) {
      if (result.duplicateWords.length < 10) {
        result.duplicateWords.push(w)
      }
    }
    seen.add(w)
  }

  return result
}

function main() {
  if (!fs.existsSync(INVENTORY_PATH)) {
    console.error(`[FAIL] Inventory not found. Run discover-source.ts first.`)
    process.exit(1)
  }

  const inventory: InventoryEntry[] = JSON.parse(fs.readFileSync(INVENTORY_PATH, 'utf-8'))
  console.log(`[VERIFY] Validating ${inventory.length} dictionaries...`)
  console.log()

  const results = inventory.map(entry => validateEntry(entry))

  // Summary
  const existing = results.filter(r => r.exists)
  const valid = results.filter(r => r.validJson && r.isArray)
  const countMatch = results.filter(r => r.countMatch)
  const withRequired = results.filter(r => r.hasRequiredFields)
  const missing = results.filter(r => !r.exists)
  const withErrors = results.filter(r => r.errors.length > 0)

  console.log('[SUMMARY] Validation Summary:')
  console.log(`   Files exist:        ${existing.length}/${inventory.length}`)
  console.log(`   Valid JSON arrays:  ${valid.length}/${inventory.length}`)
  console.log(`   Count matches:      ${countMatch.length}/${inventory.length}`)
  console.log(`   Required fields OK: ${withRequired.length}/${inventory.length}`)
  console.log()

  if (missing.length > 0) {
    console.log(`[FAIL] Missing files (${missing.length}):`)
    for (const r of missing) {
      console.log(`   ${r.id}: ${r.url}`)
    }
    console.log()
  }

  if (withErrors.length > 0) {
    console.log(`⚠️  Entries with errors (${withErrors.length}):`)
    for (const r of withErrors) {
      console.log(`   ${r.id} (${r.name}): ${r.errors.join('; ')}`)
    }
    console.log()
  }

  // Count mismatch details  
  const countMismatches = results.filter(r => r.exists && r.validJson && !r.countMatch)
  if (countMismatches.length > 0) {
    console.log(`[MISMATCH] Count mismatches (${countMismatches.length}):`)
    for (const r of countMismatches) {
      console.log(`   ${r.id}: expected ${r.expectedCount}, got ${r.actualCount}`)
    }
    console.log()
  }

  // Total word count
  const totalWords = results
    .filter(r => r.exists && r.validJson)
    .reduce((s, r) => s + r.actualCount, 0)
  console.log(`[RECORD] Total words validated: ${totalWords.toLocaleString()}`)

  // Write validation report
  const reportPath = path.resolve(import.meta.dirname, 'validation-report.json')
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      total: inventory.length,
      existing: existing.length,
      validJson: valid.length,
      countMatch: countMatch.length,
      requiredFieldsOk: withRequired.length,
      missing: missing.length,
      withErrors: withErrors.length,
      totalWords,
    },
    results,
  }, null, 2), 'utf-8')
  console.log(`   Report: ${reportPath}`)
}

main()
