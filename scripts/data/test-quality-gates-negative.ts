/**
 * test-quality-gates-negative.ts
 *
 * Automated Negative Test Suite for TypeWords Quality Gates
 * Verifies that each quality gate STRICTLY FAILS when injected with invalid data.
 *
 * Test Scenarios:
 *   1. QG-001: JSON Schema violation (missing required field, invalid enum) -> FAIL
 *   2. QG-002: Missing required field (missing id/word) -> FAIL
 *   3. QG-003: Duplicate headwords within same dictionary -> FAIL
 *   4. QG-004: Recomputed source accounting discrepancy -> FAIL
 *   5. QG-006: Empty definition text -> FAIL
 *   6. QG-007: Chinese character in definitions[].vi -> FAIL
 *   7. QG-007: Chinese character in secondary fields (examples[].vi) -> FAIL
 *   8. QG-010: Forbidden term in glossary term -> FAIL
 *   9. QG-011: Definition exceeding 250 characters -> FAIL
 *  10. QG-014: Missing provenance metadata -> FAIL
 *  11. QG-016: Missing file in localized dataset -> FAIL
 *  12. QG-016: Unexpected file not in catalog -> FAIL
 *  13. QG-016: Duplicate url in catalog -> FAIL
 */

import fs from 'node:fs'
import path from 'node:path'
import { runValidationGates, validateVocabularyEntrySchema } from './05-validate.ts'
import type { VocabularyEntry } from '../../app/core/vocabulary/adapter/legacy-word-adapter.ts'

const PROJECT_ROOT = path.resolve(import.meta.dirname, '..', '..')
const SANDBOX_DIR = path.resolve(PROJECT_ROOT, 'data/.test-sandbox')

function createValidEntry(overrides: Partial<VocabularyEntry> = {}): VocabularyEntry {
  return {
    id: 'test-1',
    word: 'test',
    normalizedWord: 'test',
    phonetic: { uk: 'test', us: 'test' },
    definitions: [
      {
        pos: 'n.',
        vi: 'bài kiểm tra, thử nghiệm',
        en: 'a procedure intended to establish the quality',
        zh: '测试',
        context: 'general',
        provenance: {
          method: 'tm',
          source: 'test-suite',
          reviewStatus: 'approved',
        },
      },
    ],
    examples: [
      {
        en: 'This is a valid test sentence.',
        vi: 'Đây là câu kiểm tra hợp lệ.',
        zh: '这是一句有效的测试句子。',
      },
    ],
    metadata: {
      source: 'test-dict',
      updatedAt: new Date().toISOString(),
    },
    ...overrides,
  }
}

function setupSandbox() {
  if (fs.existsSync(SANDBOX_DIR)) {
    fs.rmSync(SANDBOX_DIR, { recursive: true, force: true })
  }
  fs.mkdirSync(SANDBOX_DIR, { recursive: true })
}

function cleanupSandbox() {
  if (fs.existsSync(SANDBOX_DIR)) {
    fs.rmSync(SANDBOX_DIR, { recursive: true, force: true })
  }
}

interface TestAssertion {
  name: string
  gateCode: string
  expectedPassed: boolean
  run: () => { passed: boolean; details?: string }
}

function main() {
  console.log('=== Running Automated Quality Gates Negative Test Suite ===\n')

  const tests: TestAssertion[] = []
  let totalRan = 0
  let totalPassed = 0

  // 1. QG-001 Direct Schema Test
  tests.push({
    name: 'QG-001: Schema validator rejects entry with missing required property "definitions"',
    gateCode: 'QG-001',
    expectedPassed: false,
    run: () => {
      const badEntry: any = { id: 'test', word: 'test', normalizedWord: 'test' }
      const errors = validateVocabularyEntrySchema(badEntry)
      const passed = errors.length === 0
      return { passed, details: `Validator caught ${errors.length} errors: ${errors.join(', ')}` }
    },
  })

  // 2. QG-001 Direct Schema Test with invalid enum
  tests.push({
    name: 'QG-001: Schema validator rejects invalid provenance reviewStatus enum',
    gateCode: 'QG-001',
    expectedPassed: false,
    run: () => {
      const badEntry = createValidEntry()
      ;(badEntry.definitions[0].provenance as any).reviewStatus = 'not_a_valid_status'
      const errors = validateVocabularyEntrySchema(badEntry)
      const passed = errors.length === 0
      return { passed, details: `Validator caught errors: ${errors.join(', ')}` }
    },
  })

  // 3. QG-002: Missing required field (word is empty)
  tests.push({
    name: 'QG-002: Rejects entry with empty word string',
    gateCode: 'QG-002',
    expectedPassed: false,
    run: () => {
      const testDir = path.join(SANDBOX_DIR, 'qg002_loc')
      fs.mkdirSync(testDir, { recursive: true })
      const bad = createValidEntry({ word: '' })
      fs.writeFileSync(path.join(testDir, 'test.json'), JSON.stringify([bad]))

      const { results } = runValidationGates({
        localizedDir: testDir,
        catalogPath: path.join(SANDBOX_DIR, 'missing_cat.json'),
        accountingPath: path.join(SANDBOX_DIR, 'missing_acc.json'),
        silent: true,
      })
      const gate = results.find(r => r.code === 'QG-002')!
      return { passed: gate.passed, details: gate.details }
    },
  })

  // 4. QG-003: Duplicate headwords within same dictionary
  tests.push({
    name: 'QG-003: Rejects duplicate headwords within same dictionary file',
    gateCode: 'QG-003',
    expectedPassed: false,
    run: () => {
      const testDir = path.join(SANDBOX_DIR, 'qg003_loc')
      fs.mkdirSync(testDir, { recursive: true })
      const entry1 = createValidEntry({ id: '1', word: 'apple', normalizedWord: 'apple' })
      const entry2 = createValidEntry({ id: '2', word: 'Apple', normalizedWord: 'apple' })
      fs.writeFileSync(path.join(testDir, 'test.json'), JSON.stringify([entry1, entry2]))

      const { results } = runValidationGates({
        localizedDir: testDir,
        catalogPath: path.join(SANDBOX_DIR, 'missing_cat.json'),
        accountingPath: path.join(SANDBOX_DIR, 'missing_acc.json'),
        silent: true,
      })
      const gate = results.find(r => r.code === 'QG-003')!
      return { passed: gate.passed, details: gate.details }
    },
  })

  // 5. QG-004: Accounting discrepancy
  tests.push({
    name: 'QG-004: Rejects when source accounting record count mismatches actual file',
    gateCode: 'QG-004',
    expectedPassed: false,
    run: () => {
      const testLoc = path.join(SANDBOX_DIR, 'qg004_loc')
      const testRaw = path.join(SANDBOX_DIR, 'qg004_raw')
      fs.mkdirSync(testLoc, { recursive: true })
      fs.mkdirSync(testRaw, { recursive: true })

      const entry = createValidEntry()
      fs.writeFileSync(path.join(testLoc, 'test.json'), JSON.stringify([entry]))

      // Raw has 1 valid entry
      const rawEntry = { word: 'test', trans: [{ pos: 'n.', cn: 'kiểm tra' }] }
      fs.writeFileSync(path.join(testRaw, 'test.json'), JSON.stringify([rawEntry]))

      // Accounting manifest claims 5 accepted records (mismatch!)
      const badAccounting = [
        {
          dictionary: 'test.json',
          sourceCount: 1,
          acceptedCount: 5,
          rejectedCount: 0,
          deduplicatedCount: 0,
          isBalanced: false,
        },
      ]
      const accPath = path.join(SANDBOX_DIR, 'accounting.json')
      fs.writeFileSync(accPath, JSON.stringify(badAccounting))

      const { results } = runValidationGates({
        localizedDir: testLoc,
        rawDir: testRaw,
        accountingPath: accPath,
        catalogPath: path.join(SANDBOX_DIR, 'missing_cat.json'),
        silent: true,
      })
      const gate = results.find(r => r.code === 'QG-004')!
      return { passed: gate.passed, details: gate.details }
    },
  })

  // 6. QG-006: Empty definition text
  tests.push({
    name: 'QG-006: Rejects empty or whitespace-only definition string',
    gateCode: 'QG-006',
    expectedPassed: false,
    run: () => {
      const testDir = path.join(SANDBOX_DIR, 'qg006_loc')
      fs.mkdirSync(testDir, { recursive: true })
      const bad = createValidEntry()
      bad.definitions[0].vi = '   '
      fs.writeFileSync(path.join(testDir, 'test.json'), JSON.stringify([bad]))

      const { results } = runValidationGates({
        localizedDir: testDir,
        catalogPath: path.join(SANDBOX_DIR, 'missing_cat.json'),
        accountingPath: path.join(SANDBOX_DIR, 'missing_acc.json'),
        silent: true,
      })
      const gate = results.find(r => r.code === 'QG-006')!
      return { passed: gate.passed, details: gate.details }
    },
  })

  // 7. QG-007: Chinese character in definitions[].vi
  tests.push({
    name: 'QG-007: Rejects Chinese character leakage in definitions[].vi',
    gateCode: 'QG-007',
    expectedPassed: false,
    run: () => {
      const testDir = path.join(SANDBOX_DIR, 'qg007_loc1')
      fs.mkdirSync(testDir, { recursive: true })
      const bad = createValidEntry()
      bad.definitions[0].vi = 'chúc mừng 恭喜'
      fs.writeFileSync(path.join(testDir, 'test.json'), JSON.stringify([bad]))

      const { results } = runValidationGates({
        localizedDir: testDir,
        catalogPath: path.join(SANDBOX_DIR, 'missing_cat.json'),
        accountingPath: path.join(SANDBOX_DIR, 'missing_acc.json'),
        silent: true,
      })
      const gate = results.find(r => r.code === 'QG-007')!
      return { passed: gate.passed, details: gate.details }
    },
  })

  // 8. QG-007: Chinese character in secondary fields (examples[].vi)
  tests.push({
    name: 'QG-007: Rejects Chinese character leakage in examples[].vi',
    gateCode: 'QG-007',
    expectedPassed: false,
    run: () => {
      const testDir = path.join(SANDBOX_DIR, 'qg007_loc2')
      fs.mkdirSync(testDir, { recursive: true })
      const bad = createValidEntry()
      bad.examples![0].vi = '这是一个测试'
      fs.writeFileSync(path.join(testDir, 'test.json'), JSON.stringify([bad]))

      const { results } = runValidationGates({
        localizedDir: testDir,
        catalogPath: path.join(SANDBOX_DIR, 'missing_cat.json'),
        accountingPath: path.join(SANDBOX_DIR, 'missing_acc.json'),
        silent: true,
      })
      const gate = results.find(r => r.code === 'QG-007')!
      return { passed: gate.passed, details: gate.details }
    },
  })

  // 9. QG-010: Forbidden term in glossary term
  tests.push({
    name: 'QG-010: Rejects forbidden translation per glossary rules',
    gateCode: 'QG-010',
    expectedPassed: false,
    run: () => {
      const testDir = path.join(SANDBOX_DIR, 'qg010_loc')
      fs.mkdirSync(testDir, { recursive: true })
      const bad = createValidEntry({
        word: 'cursor',
        normalizedWord: 'cursor',
        definitions: [
          {
            pos: 'n.',
            vi: 'người chạy trên màn hình máy tính',
            provenance: { method: 'manual', source: 'test', reviewStatus: 'approved' },
          },
        ],
      })
      fs.writeFileSync(path.join(testDir, 'test.json'), JSON.stringify([bad]))

      const glossPath = path.join(SANDBOX_DIR, 'glossary.json')
      fs.writeFileSync(
        glossPath,
        JSON.stringify({
          terms: {
            cursor: { preferred: 'con trỏ', forbidden: ['người chạy'], context: 'IT' },
          },
        })
      )

      const { results } = runValidationGates({
        localizedDir: testDir,
        glossaryPath: glossPath,
        catalogPath: path.join(SANDBOX_DIR, 'missing_cat.json'),
        accountingPath: path.join(SANDBOX_DIR, 'missing_acc.json'),
        silent: true,
      })
      const gate = results.find(r => r.code === 'QG-010')!
      return { passed: gate.passed, details: gate.details }
    },
  })

  // 10. QG-011: Definition exceeding 250 characters
  tests.push({
    name: 'QG-011: Rejects definition text exceeding 250 characters',
    gateCode: 'QG-011',
    expectedPassed: false,
    run: () => {
      const testDir = path.join(SANDBOX_DIR, 'qg011_loc')
      fs.mkdirSync(testDir, { recursive: true })
      const bad = createValidEntry()
      bad.definitions[0].vi = 'Đây là một định nghĩa rất dài '.repeat(15) // ~450 chars
      fs.writeFileSync(path.join(testDir, 'test.json'), JSON.stringify([bad]))

      const { results } = runValidationGates({
        localizedDir: testDir,
        catalogPath: path.join(SANDBOX_DIR, 'missing_cat.json'),
        accountingPath: path.join(SANDBOX_DIR, 'missing_acc.json'),
        silent: true,
      })
      const gate = results.find(r => r.code === 'QG-011')!
      return { passed: gate.passed, details: gate.details }
    },
  })

  // 11. QG-014: Missing provenance metadata
  tests.push({
    name: 'QG-014: Rejects definition missing provenance metadata',
    gateCode: 'QG-014',
    expectedPassed: false,
    run: () => {
      const testDir = path.join(SANDBOX_DIR, 'qg014_loc')
      fs.mkdirSync(testDir, { recursive: true })
      const bad = createValidEntry()
      delete bad.definitions[0].provenance
      fs.writeFileSync(path.join(testDir, 'test.json'), JSON.stringify([bad]))

      const { results } = runValidationGates({
        localizedDir: testDir,
        catalogPath: path.join(SANDBOX_DIR, 'missing_cat.json'),
        accountingPath: path.join(SANDBOX_DIR, 'missing_acc.json'),
        silent: true,
      })
      const gate = results.find(r => r.code === 'QG-014')!
      return { passed: gate.passed, details: gate.details }
    },
  })

  // 12. QG-016: Missing file in localized dataset
  tests.push({
    name: 'QG-016: Rejects when catalog file is missing in localized dataset',
    gateCode: 'QG-016',
    expectedPassed: false,
    run: () => {
      const testDir = path.join(SANDBOX_DIR, 'qg016_loc1')
      fs.mkdirSync(testDir, { recursive: true })
      const entry = createValidEntry()
      fs.writeFileSync(path.join(testDir, 'fileA.json'), JSON.stringify([entry]))

      // Catalog has fileA and fileB (fileB missing from localized)
      const catPath = path.join(SANDBOX_DIR, 'cat1.json')
      fs.writeFileSync(
        catPath,
        JSON.stringify([
          { id: 1, name: 'File A', url: 'fileA.json', length: 1 },
          { id: 2, name: 'File B', url: 'fileB.json', length: 1 },
        ])
      )

      const { results } = runValidationGates({
        localizedDir: testDir,
        catalogPath: catPath,
        accountingPath: path.join(SANDBOX_DIR, 'missing_acc.json'),
        silent: true,
      })
      const gate = results.find(r => r.code === 'QG-016')!
      return { passed: gate.passed, details: gate.details }
    },
  })

  // 13. QG-016: Unexpected file not registered in catalog
  tests.push({
    name: 'QG-016: Rejects when localized dataset has extra unregistered file',
    gateCode: 'QG-016',
    expectedPassed: false,
    run: () => {
      const testDir = path.join(SANDBOX_DIR, 'qg016_loc2')
      fs.mkdirSync(testDir, { recursive: true })
      const entry = createValidEntry()
      fs.writeFileSync(path.join(testDir, 'fileA.json'), JSON.stringify([entry]))
      fs.writeFileSync(path.join(testDir, 'extra_rogue_file.json'), JSON.stringify([entry]))

      // Catalog only has fileA
      const catPath = path.join(SANDBOX_DIR, 'cat2.json')
      fs.writeFileSync(
        catPath,
        JSON.stringify([{ id: 1, name: 'File A', url: 'fileA.json', length: 1 }])
      )

      const { results } = runValidationGates({
        localizedDir: testDir,
        catalogPath: catPath,
        accountingPath: path.join(SANDBOX_DIR, 'missing_acc.json'),
        silent: true,
      })
      const gate = results.find(r => r.code === 'QG-016')!
      return { passed: gate.passed, details: gate.details }
    },
  })

  // 14. QG-016: Duplicate url in catalog
  tests.push({
    name: 'QG-016: Rejects duplicate catalog url entries',
    gateCode: 'QG-016',
    expectedPassed: false,
    run: () => {
      const testDir = path.join(SANDBOX_DIR, 'qg016_loc3')
      fs.mkdirSync(testDir, { recursive: true })
      const entry = createValidEntry()
      fs.writeFileSync(path.join(testDir, 'fileA.json'), JSON.stringify([entry]))

      // Catalog has duplicate fileA.json
      const catPath = path.join(SANDBOX_DIR, 'cat3.json')
      fs.writeFileSync(
        catPath,
        JSON.stringify([
          { id: 1, name: 'File A Primary', url: 'fileA.json', length: 1 },
          { id: 2, name: 'File A Duplicate', url: 'fileA.json', length: 1 },
        ])
      )

      const { results } = runValidationGates({
        localizedDir: testDir,
        catalogPath: catPath,
        accountingPath: path.join(SANDBOX_DIR, 'missing_acc.json'),
        silent: true,
      })
      const gate = results.find(r => r.code === 'QG-016')!
      return { passed: gate.passed, details: gate.details }
    },
  })

  setupSandbox()

  try {
    for (const t of tests) {
      totalRan++
      try {
        const res = t.run()
        const correctlyFailed = res.passed === t.expectedPassed
        if (correctlyFailed) {
          totalPassed++
          console.log(`[PASS] ${t.name}`)
          console.log(`       -> Gate correctly failed: ${res.details || 'passed === false'}`)
        } else {
          console.error(`[FAIL] ${t.name}`)
          console.error(`       -> Gate unexpectedly passed or behaved differently: ${res.details}`)
        }
      } catch (err: any) {
        console.error(`[ERROR] Test crashed: ${t.name}: ${err.message}`)
      }
    }
  } finally {
    cleanupSandbox()
  }

  console.log(`\n=== Negative Test Results: ${totalPassed}/${totalRan} tests passed ===`)

  if (totalPassed !== totalRan) {
    console.error(`[FAIL] ${totalRan - totalPassed} negative tests failed. Gates are not strictly enforcing constraints.`)
    process.exit(1)
  }

  console.log(`[SUCCESS] All negative tests passed! Quality gates are proven to fail on invalid input.`)
}

main()
