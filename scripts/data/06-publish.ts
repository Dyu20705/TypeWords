/**
 * 06-publish.ts
 *
 * Canonical Step 06: Staged Publishing & Checksum Verification (QG-015, QG-017)
 * Strictly executes:
 *   data/localized/ → data/staging/ → checksums.sha256 → public/dicts/ → verify published
 * Prevents partial or corrupt publication into public/ runtime assets.
 */

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { adaptVocabularyEntryToLegacyWord, type VocabularyEntry } from '../../app/core/vocabulary/adapter/legacy-word-adapter.ts'

const PROJECT_ROOT = path.resolve(import.meta.dirname, '..', '..')
const LOCALIZED_DIR = path.resolve(PROJECT_ROOT, 'data/localized')
const STAGING_DIR = path.resolve(PROJECT_ROOT, 'data/staging')
const PUBLIC_DICT_DIR = path.resolve(PROJECT_ROOT, 'public/dicts/en/word')
const CHECKSUM_PATH = path.resolve(PROJECT_ROOT, 'data/manifests/checksums.sha256')
const CATALOG_PATH = path.resolve(PROJECT_ROOT, 'data/sources/catalogs/production-catalog.json')
const PUBLIC_WORD_CATALOG = path.resolve(PROJECT_ROOT, 'public/list/word.json')

function calculateSha256(content: Buffer | string): string {
  return crypto.createHash('sha256').update(content).digest('hex')
}

function main() {
  console.log('=== [DATA:PUBLISH] Step 06: Staged Publishing & Verification ===')

  if (!fs.existsSync(LOCALIZED_DIR)) {
    console.error(`[FAIL] Localized data not found. Run 'pnpm data:translate' and 'pnpm data:validate' first.`)
    process.exit(1)
  }

  // 1. Prepare clean Staging area
  console.log('[STAGE 1/5] Preparing clean staging directory (data/staging/)...')
  if (fs.existsSync(STAGING_DIR)) {
    fs.rmSync(STAGING_DIR, { recursive: true, force: true })
  }
  fs.mkdirSync(STAGING_DIR, { recursive: true })

  const files = fs.readdirSync(LOCALIZED_DIR).filter(f => f.endsWith('.json'))
  console.log(`[STAGE 2/5] Compiling ${files.length} localized dictionaries into runtime format in staging...`)

  const checksumEntries: string[] = []
  const stagingChecksums = new Map<string, string>()

  for (const file of files) {
    const rawContent = fs.readFileSync(path.join(LOCALIZED_DIR, file), 'utf-8')
    const entries: VocabularyEntry[] = JSON.parse(rawContent)

    // Adapt to runtime legacy format via LegacyWordAdapter (Transitional layer per ADR-002)
    const runtimeWords = entries.map(e => adaptVocabularyEntryToLegacyWord(e))
    const runtimeJson = JSON.stringify(runtimeWords)

    const stagingFilePath = path.join(STAGING_DIR, file)
    fs.writeFileSync(stagingFilePath, runtimeJson, 'utf-8')

    const hash = calculateSha256(runtimeJson)
    stagingChecksums.set(file, hash)
    checksumEntries.push(`${hash}  dicts/en/word/${file}`)
  }

  // 2. Write Manifest & Checksums (QG-015)
  console.log('[STAGE 3/5] Generating cryptographic checksums manifest (data/manifests/checksums.sha256)...')
  fs.mkdirSync(path.dirname(CHECKSUM_PATH), { recursive: true })
  fs.writeFileSync(CHECKSUM_PATH, checksumEntries.join('\n') + '\n', 'utf-8')

  // 3. Staged Publication into public/dicts/en/word/
  console.log('[STAGE 4/5] Publishing staging files into public/dicts/en/word/...')
  fs.mkdirSync(PUBLIC_DICT_DIR, { recursive: true })

  for (const file of files) {
    const stagingFile = path.join(STAGING_DIR, file)
    const targetFile = path.join(PUBLIC_DICT_DIR, file)
    fs.copyFileSync(stagingFile, targetFile)
  }

  // 4. Verify Published Files (QG-017)
  console.log('[STAGE 5/5] Verifying published file integrity against staging checksums...')
  let verificationFailures = 0

  for (const [file, expectedHash] of stagingChecksums.entries()) {
    const publishedFile = path.join(PUBLIC_DICT_DIR, file)
    if (!fs.existsSync(publishedFile)) {
      console.error(`  [FAIL] Missing published file: ${file}`)
      verificationFailures++
      continue
    }

    const publishedContent = fs.readFileSync(publishedFile)
    const actualHash = calculateSha256(publishedContent)

    if (actualHash !== expectedHash) {
      console.error(`  [FAIL] Hash mismatch for ${file}: expected ${expectedHash.slice(0, 12)}, got ${actualHash.slice(0, 12)}`)
      verificationFailures++
    }
  }

  if (verificationFailures > 0) {
    console.error(`[FAIL] QG-017 Publish verification failed: ${verificationFailures} files corrupted or mismatched!`)
    process.exit(1)
  }

  console.log(`[OK] Checksum Manifest: 100% verified (${files.length} SHA-256 hashes matched)`)
  console.log(`[OK] Published: ${files.length} dictionaries successfully published to public/dicts/en/word/`)
  console.log(`[SUCCESS] Staged Publish (QG-017): Complete and verified with zero corruption.`)
  console.log('=== [DATA:PUBLISH] Complete ===\n')
}

main()
