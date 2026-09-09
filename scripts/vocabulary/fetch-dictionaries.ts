/**
 * fetch-dictionaries.ts
 * 
 * Downloads all dictionary JSON files from the TypeWords CDN.
 * Supports resumption — skips already-downloaded files.
 * Writes a download report.
 */

import fs from 'fs'
import path from 'path'

const INVENTORY_PATH = path.resolve(import.meta.dirname, 'inventory.json')
const REPORT_PATH = path.resolve(import.meta.dirname, 'download-report.json')
const PROJECT_ROOT = path.resolve(import.meta.dirname, '..', '..')
const MAX_CONCURRENT = 5
const RETRY_COUNT = 3
const RETRY_DELAY_MS = 2000

interface InventoryEntry {
  id: string
  name: string
  url: string
  length: number
  language: string
  downloadUrl: string
  localPath: string
}

interface DownloadResult {
  id: string
  url: string
  localPath: string
  status: 'success' | 'skipped' | 'failed'
  fileSize?: number
  recordCount?: number
  error?: string
}

async function downloadWithRetry(url: string, retries: number = RETRY_COUNT): Promise<Buffer> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
      })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const contentType = response.headers.get('content-type') || ''
      if (!contentType.includes('json') && !contentType.includes('octet-stream')) {
        throw new Error(`Unexpected content-type: ${contentType}`)
      }
      return Buffer.from(await response.arrayBuffer())
    } catch (err: any) {
      if (attempt < retries) {
        console.warn(`   ⚠️  Attempt ${attempt}/${retries} failed: ${err.message}. Retrying in ${RETRY_DELAY_MS}ms...`)
        await new Promise(r => setTimeout(r, RETRY_DELAY_MS * attempt))
      } else {
        throw err
      }
    }
  }
  throw new Error('Unreachable')
}

async function downloadOne(entry: InventoryEntry, force: boolean = false): Promise<DownloadResult> {
  const localAbsPath = path.resolve(PROJECT_ROOT, entry.localPath)
  
  // Check if already exists
  if (!force && fs.existsSync(localAbsPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(localAbsPath, 'utf-8'))
      if (Array.isArray(existing) && existing.length > 0) {
        return {
          id: entry.id,
          url: entry.url,
          localPath: entry.localPath,
          status: 'skipped',
          fileSize: fs.statSync(localAbsPath).size,
          recordCount: existing.length,
        }
      }
    } catch {
      // File exists but is invalid, re-download
    }
  }

  try {
    const data = await downloadWithRetry(entry.downloadUrl)
    
    // Validate it's valid JSON array
    const parsed = JSON.parse(data.toString('utf-8'))
    if (!Array.isArray(parsed)) {
      throw new Error('Downloaded data is not a JSON array')
    }

    // Ensure directory exists
    fs.mkdirSync(path.dirname(localAbsPath), { recursive: true })
    
    // Write file
    fs.writeFileSync(localAbsPath, data)

    return {
      id: entry.id,
      url: entry.url,
      localPath: entry.localPath,
      status: 'success',
      fileSize: data.length,
      recordCount: parsed.length,
    }
  } catch (err: any) {
    return {
      id: entry.id,
      url: entry.url,
      localPath: entry.localPath,
      status: 'failed',
      error: err.message,
    }
  }
}

async function downloadBatch(entries: InventoryEntry[], concurrency: number): Promise<DownloadResult[]> {
  const results: DownloadResult[] = []
  const queue = [...entries]
  let completed = 0

  async function worker() {
    while (queue.length > 0) {
      const entry = queue.shift()!
      const result = await downloadOne(entry)
      results.push(result)
      completed++
      
      const icon = result.status === 'success' ? '✅' : result.status === 'skipped' ? '⏭️' : '❌'
      const extra = result.recordCount ? ` (${result.recordCount} words)` : result.error ? ` — ${result.error}` : ''
      console.log(`${icon} [${completed}/${entries.length}] ${entry.name}${extra}`)
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, entries.length) }, () => worker())
  await Promise.all(workers)
  return results
}

async function main() {
  if (!fs.existsSync(INVENTORY_PATH)) {
    console.error(`[FAIL] Inventory not found. Run discover-source.ts first.`)
    process.exit(1)
  }

  const inventory: InventoryEntry[] = JSON.parse(fs.readFileSync(INVENTORY_PATH, 'utf-8'))
  console.log(`[FETCH] Starting download of ${inventory.length} dictionaries...`)
  console.log(`   Concurrency: ${MAX_CONCURRENT}`)
  console.log(`   Retries: ${RETRY_COUNT}`)
  console.log()

  const results = await downloadBatch(inventory, MAX_CONCURRENT)
  
  // Summary
  const success = results.filter(r => r.status === 'success')
  const skipped = results.filter(r => r.status === 'skipped')
  const failed = results.filter(r => r.status === 'failed')

  console.log()
  console.log('[SUMMARY] Download Summary:')
  console.log(`   [OK] Downloaded: ${success.length}`)
  console.log(`   ⏭️  Skipped (already exists): ${skipped.length}`)
  console.log(`   [FAIL] Failed: ${failed.length}`)

  if (failed.length > 0) {
    console.log()
    console.log('[FAIL] Failed downloads:')
    for (const f of failed) {
      console.log(`   ${f.id}: ${f.error}`)
    }
  }

  const totalWords = results
    .filter(r => r.recordCount)
    .reduce((s, r) => s + r.recordCount!, 0)
  console.log()
  console.log(`   Total words downloaded: ${totalWords.toLocaleString()}`)

  // Write report
  fs.writeFileSync(REPORT_PATH, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalDictionaries: inventory.length,
    downloaded: success.length,
    skipped: skipped.length,
    failed: failed.length,
    totalWords,
    results,
  }, null, 2), 'utf-8')
  console.log(`   Report: ${REPORT_PATH}`)
}

main().catch(err => {
  console.error('[FAIL] Fatal error:', err)
  process.exit(1)
})
