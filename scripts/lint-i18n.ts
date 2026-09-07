import fs from 'node:fs'
import path from 'node:path'

const localesDir = path.resolve(process.cwd(), 'i18n/locales')
const viPath = path.join(localesDir, 'vi.json')
const enPath = path.join(localesDir, 'en.json')

function loadJson(filePath: string) {
  if (!fs.existsSync(filePath)) {
    console.error(`[ERROR] File does not exist: ${filePath}`)
    process.exit(1)
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(raw)
  } catch (err: any) {
    console.error(`[ERROR] Failed to parse JSON: ${filePath} - ${err.message}`)
    process.exit(1)
  }
}

function getFlattenedKeys(obj: Record<string, any>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, val] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      Object.assign(result, getFlattenedKeys(val, fullKey))
    } else {
      result[fullKey] = String(val ?? '')
    }
  }
  return result
}

console.log('--- Running i18n lint check ---')
const viObj = loadJson(viPath)
const enObj = loadJson(enPath)

const viFlat = getFlattenedKeys(viObj)
const enFlat = getFlattenedKeys(enObj)

const viKeys = new Set(Object.keys(viFlat))
const enKeys = new Set(Object.keys(enFlat))

let hasError = false

// Check key counts
console.log(`vi.json total keys: ${viKeys.size}`)
console.log(`en.json total keys: ${enKeys.size}`)

// Check keys in EN missing in VI
const missingInVi: string[] = []
for (const k of enKeys) {
  if (!viKeys.has(k)) {
    missingInVi.push(k)
  }
}
if (missingInVi.length > 0) {
  console.error(`[ERROR] ${missingInVi.length} keys present in en.json but missing in vi.json:`)
  missingInVi.forEach((k) => console.error(`  - ${k}`))
  hasError = true
}

// Check keys in VI missing in EN
const missingInEn: string[] = []
for (const k of viKeys) {
  if (!enKeys.has(k)) {
    missingInEn.push(k)
  }
}
if (missingInEn.length > 0) {
  console.error(`[ERROR] ${missingInEn.length} keys present in vi.json but missing in en.json:`)
  missingInEn.forEach((k) => console.error(`  - ${k}`))
  hasError = true
}

// Check for Chinese characters in vi.json
const zhRegex = /[\u4e00-\u9fa5]/
const zhInVi: { key: string; val: string }[] = []
for (const [k, val] of Object.entries(viFlat)) {
  if (zhRegex.test(val)) {
    zhInVi.push({ key: k, val })
  }
}
if (zhInVi.length > 0) {
  console.error(`[ERROR] Found ${zhInVi.length} Chinese values in vi.json:`)
  zhInVi.forEach(({ key, val }) => console.error(`  - ${key}: "${val}"`))
  hasError = true
}

// Check unsupported locales
const supportedLocales = ['vi.json', 'en.json']
const allLocaleFiles = fs.readdirSync(localesDir)
const extraLocales = allLocaleFiles.filter((f) => f.endsWith('.json') && !supportedLocales.includes(f))
if (extraLocales.length > 0) {
  console.error(`[ERROR] Unsupported locale files found in ${localesDir}: ${extraLocales.join(', ')}`)
  hasError = true
}

if (hasError) {
  console.error('❌ i18n lint failed.')
  process.exit(1)
} else {
  console.log('✅ i18n lint passed with 100% key parity and zero Chinese characters in vi.json.')
}
