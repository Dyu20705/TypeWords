/**
 * 02-fetch.ts
 *
 * Canonical Step 02: Fetch & Cache Raw Dictionaries
 * Verifies presence of all 194 dictionaries and downloads missing files from CDN if needed.
 */

import fs from 'node:fs'
import path from 'node:path'

const PROJECT_ROOT = path.resolve(import.meta.dirname, '..', '..')
const INVENTORY_PATH = path.resolve(PROJECT_ROOT, 'data/manifests/inventory.json')
const RAW_DIR = path.resolve(PROJECT_ROOT, 'data/sources/raw')
const RUNTIME_DIR = path.resolve(PROJECT_ROOT, 'public/dicts/en/word')

interface InventoryEntry {
  id: string | number
  name: string
  url: string
  downloadUrl: string
  length: number
}

async function main() {
  console.log('=== [DATA:FETCH] Step 02: Fetching & Verifying Raw Sources ===')

  if (!fs.existsSync(INVENTORY_PATH)) {
    console.error(`[FAIL] Inventory not found. Please run 'pnpm data:discover' first.`)
    process.exit(1)
  }

  const inventory: InventoryEntry[] = JSON.parse(fs.readFileSync(INVENTORY_PATH, 'utf-8'))
  fs.mkdirSync(RAW_DIR, { recursive: true })

  let availableCount = 0
  let missingCount = 0
  const missingEntries: InventoryEntry[] = []

  for (const item of inventory) {
    const rawPath = path.join(RAW_DIR, item.url)
    const runtimePath = path.join(RUNTIME_DIR, item.url)

    if (fs.existsSync(rawPath) || fs.existsSync(runtimePath)) {
      availableCount++
    } else {
      missingCount++
      missingEntries.push(item)
    }
  }

  console.log(`[STATUS] Available locally : ${availableCount}/${inventory.length}`)
  console.log(`[STATUS] Missing from disk : ${missingCount}`)

  if (missingEntries.length > 0) {
    console.log(`[INFO] Attempting to download ${missingEntries.length} missing dictionaries...`)
    for (const item of missingEntries) {
      try {
        console.log(`  Downloading: ${item.name} (${item.url})...`)
        const res = await fetch(item.downloadUrl)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        fs.writeFileSync(path.join(RAW_DIR, item.url), JSON.stringify(data), 'utf-8')
        availableCount++
        console.log(`  [OK] Saved to data/sources/raw/${item.url}`)
      } catch (err: any) {
        console.error(`  [ERROR] Failed to fetch ${item.url}: ${err.message}`)
      }
    }
  }

  console.log(`[SUMMARY] Total dictionaries ready for normalization: ${availableCount}/${inventory.length}`)
  console.log('=== [DATA:FETCH] Complete ===\n')
}

main()
