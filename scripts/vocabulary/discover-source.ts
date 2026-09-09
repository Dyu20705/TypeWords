/**
 * discover-source.ts
 * 
 * Parses the production TypeWords catalog (word.json) and produces
 * a machine-readable inventory of all available dictionaries with
 * their download URLs.
 */

import fs from 'fs'
import path from 'path'

const CATALOG_PATH = path.resolve(import.meta.dirname, 'production-catalog.json')
const INVENTORY_PATH = path.resolve(import.meta.dirname, 'inventory.json')
const CDN_BASE = 'https://files.typewords.cc'

interface CatalogEntry {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
  url: string
  length: number
  language: string
  translateLanguage: string
}

interface InventoryEntry extends CatalogEntry {
  downloadUrl: string
  localPath: string
}

function main() {
  if (!fs.existsSync(CATALOG_PATH)) {
    console.error(`[FAIL] Production catalog not found at ${CATALOG_PATH}`)
    console.error('   Run: curl -sL "https://files.typewords.cc/list/word.json" -o scripts/vocabulary/production-catalog.json')
    process.exit(1)
  }

  const catalog: CatalogEntry[] = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf-8'))
  
  console.log(`[INFO] Production catalog loaded: ${catalog.length} dictionaries`)
  console.log()

  // Build inventory with download URLs
  const inventory: InventoryEntry[] = catalog.map(entry => ({
    ...entry,
    downloadUrl: `${CDN_BASE}/dicts/${entry.language}/word/${entry.url}`,
    localPath: `public/dicts/${entry.language}/word/${entry.url}`,
  }))

  // Stats
  const totalWords = inventory.reduce((sum, e) => sum + (e.length || 0), 0)
  const categories = [...new Set(inventory.map(e => e.category))]
  const tags = [...new Set(inventory.flatMap(e => e.tags))]

  console.log(`[SUMMARY] Inventory Summary:`)
  console.log(`   Dictionaries: ${inventory.length}`)
  console.log(`   Total words:  ${totalWords.toLocaleString()}`)
  console.log(`   Categories:   ${categories.join(', ')}`)
  console.log(`   Tags:         ${tags.join(', ')}`)
  console.log()

  // Per-category breakdown
  console.log('[CATEGORY] By category:')
  for (const cat of categories) {
    const catDicts = inventory.filter(e => e.category === cat)
    const catWords = catDicts.reduce((s, e) => s + (e.length || 0), 0)
    console.log(`   ${cat}: ${catDicts.length} dicts, ${catWords.toLocaleString()} words`)
  }
  console.log()

  // List unique filenames
  const urls = inventory.map(e => e.url)
  const uniqueUrls = [...new Set(urls)]
  if (urls.length !== uniqueUrls.length) {
    console.warn(`⚠️  Duplicate URLs detected: ${urls.length} entries, ${uniqueUrls.length} unique filenames`)
    const dupes = urls.filter((u, i) => urls.indexOf(u) !== i)
    for (const d of [...new Set(dupes)]) {
      const entries = inventory.filter(e => e.url === d)
      console.warn(`   "${d}" used by: ${entries.map(e => e.id).join(', ')}`)
    }
  }

  // Write inventory
  fs.writeFileSync(INVENTORY_PATH, JSON.stringify(inventory, null, 2), 'utf-8')
  console.log(`[OK] Inventory written to ${INVENTORY_PATH}`)
}

main()
