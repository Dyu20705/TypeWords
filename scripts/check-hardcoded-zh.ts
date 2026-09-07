import fs from 'node:fs'
import path from 'node:path'

console.log('--- Running Check for Hardcoded Chinese Characters ---')

let hasError = false

// 1. Check vi.json for any Chinese characters
const viPath = path.resolve('i18n/locales/vi.json')
const viContent = fs.readFileSync(viPath, 'utf8')
const zhRegex = /[\u4e00-\u9fa5]/

if (zhRegex.test(viContent)) {
  console.error('❌ Error: Chinese characters found in i18n/locales/vi.json!')
  hasError = true
} else {
  console.log('✅ i18n/locales/vi.json contains 0 Chinese characters')
}

// 2. Scan app directory
function walkDir(dir: string): string[] {
  let results: string[] = []
  const list = fs.readdirSync(dir)
  list.forEach(file => {
    const full = path.join(dir, file)
    const stat = fs.statSync(full)
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(full))
    } else if (/\.(vue|ts)$/.test(file)) {
      results.push(full)
    }
  })
  return results
}

const files = walkDir('app')

// Allowlist for files that contain legacy migration mappings or asset filenames
const allowedScriptFiles = new Set([
  path.normalize('app/core/utils/migration.ts'),
  path.normalize('app/components/setting/Log.vue'),
  path.normalize('app/components/ResourceCard.vue'),
  path.normalize('app/core/config/env.ts'),
  path.normalize('app/core/hooks/sound.ts'),
  path.normalize('app/core/stores/setting.ts'),
  path.normalize('app/core/utils/index.ts'),
  path.normalize('app/pages/(articles)/book-list.vue'),
  path.normalize('app/pages/(words)/dict-list.vue'),
])

let scannedFiles = 0
let violations: { file: string; line: number; text: string }[] = []

files.forEach(file => {
  const normPath = path.normalize(file)
  const content = fs.readFileSync(file, 'utf8')
  scannedFiles++

  // If file is in allowlist, check only template if it's not Log.vue
  if (normPath.includes('Log.vue')) {
    return
  }

  if (file.endsWith('.vue')) {
    // Check template part strictly (excluding HTML comments)
    const templateMatch = content.match(/<template>([\s\S]*?)<\/template>/)
    if (templateMatch) {
      const templateRaw = templateMatch[1]
      const strippedTemplate = templateRaw.replace(/<!--[\s\S]*?-->/g, '')
      const lines = strippedTemplate.split('\n')
      lines.forEach((line, idx) => {
        if (zhRegex.test(line)) {
          violations.push({
            file,
            line: idx + 1,
            text: line.trim(),
          })
        }
      })
    }
  }

  // Check script/ts if not in allowedScriptFiles
  if (!allowedScriptFiles.has(normPath)) {
    // Strip comments
    const stripped = content
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*/g, '')
      .replace(/<!--[\s\S]*?-->/g, '')

    const lines = stripped.split('\n')
    lines.forEach((line, idx) => {
      if (zhRegex.test(line)) {
        violations.push({
          file,
          line: idx + 1,
          text: line.trim(),
        })
      }
    })
  }
})

if (violations.length > 0) {
  console.error(`❌ Found ${violations.length} hardcoded Chinese character violations:`)
  violations.forEach(v => {
    console.error(`  ${v.file}:${v.line} -> ${v.text}`)
  })
  hasError = true
} else {
  console.log(`✅ Scanned ${scannedFiles} files across app/: ZERO hardcoded Chinese UI strings found!`)
}

if (hasError) {
  process.exit(1)
} else {
  console.log('🎉 All hardcoded Chinese checks passed successfully!')
  process.exit(0)
}
