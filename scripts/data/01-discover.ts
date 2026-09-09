/**
 * 01-discover.ts
 *
 * Canonical Step 01: Discover & Inventory
 * Parses source catalogs and generates `data/manifests/inventory.json`.
 */

import fs from 'node:fs'
import path from 'node:path'

const PROJECT_ROOT = path.resolve(import.meta.dirname, '..', '..')
const CATALOG_PATH = path.resolve(PROJECT_ROOT, 'data/sources/catalogs/production-catalog.json')
const INVENTORY_PATH = path.resolve(PROJECT_ROOT, 'data/manifests/inventory.json')
const CDN_BASE = 'https://files.typewords.cc'

interface CatalogEntry {
  id: string | number
  name: string
  description: string
  category: string
  tags: string[]
  url: string
  length: number
  language: string
  translateLanguage: string
  recommended?: boolean
  cover?: string
}

interface InventoryEntry extends CatalogEntry {
  downloadUrl: string
  localRuntimePath: string
  normalizedPath: string
  localizedPath: string
}

function main() {
  console.log('=== [DATA:DISCOVER] Step 01: Discovering Source Dictionaries ===')

  if (!fs.existsSync(CATALOG_PATH)) {
    console.error(`[FAIL] Production catalog not found at: ${CATALOG_PATH}`)
    process.exit(1)
  }

  const catalog: CatalogEntry[] = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf-8'))
  console.log(`[INFO] Loaded production catalog: ${catalog.length} dictionaries`)

  const inventory: InventoryEntry[] = catalog.map(entry => ({
    ...entry,
    downloadUrl: `${CDN_BASE}/dicts/${entry.language}/word/${entry.url}`,
    localRuntimePath: `public/dicts/${entry.language}/word/${entry.url}`,
    normalizedPath: `data/normalized/${entry.url}`,
    localizedPath: `data/localized/${entry.url}`,
  }))

  const totalWords = inventory.reduce((sum, e) => sum + (e.length || 0), 0)
  const categories = [...new Set(inventory.map(e => e.category))]

  fs.mkdirSync(path.dirname(INVENTORY_PATH), { recursive: true })
  fs.writeFileSync(INVENTORY_PATH, JSON.stringify(inventory, null, 2), 'utf-8')

  console.log(`[OK] Inventory written to: ${INVENTORY_PATH}`)
  console.log(`[SUMMARY] Total dictionaries : ${inventory.length}`)
  console.log(`[SUMMARY] Total expected words: ${totalWords.toLocaleString()}`)
  console.log(`[SUMMARY] Total categories   : ${categories.length}`)
  console.log('=== [DATA:DISCOVER] Complete ===\n')
}

main()
