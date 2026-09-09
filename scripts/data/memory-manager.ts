/**
 * memory-manager.ts
 *
 * Translation Memory & Glossary Management Utility
 * Allows auditing, querying, and appending terms to `glossary.vi.json` and `approved.jsonl`.
 */

import fs from 'node:fs'
import path from 'node:path'

const PROJECT_ROOT = path.resolve(import.meta.dirname, '..', '..')
const GLOSSARY_PATH = path.resolve(PROJECT_ROOT, 'data/translation-memory/glossary.vi.json')
const APPROVED_PATH = path.resolve(PROJECT_ROOT, 'data/translation-memory/approved.jsonl')
const REJECTED_PATH = path.resolve(PROJECT_ROOT, 'data/translation-memory/rejected.jsonl')

export function getGlossaryTerms(): Record<string, any> {
  if (!fs.existsSync(GLOSSARY_PATH)) return {}
  const data = JSON.parse(fs.readFileSync(GLOSSARY_PATH, 'utf-8'))
  return data.terms || {}
}

export function getApprovedMemory(): any[] {
  if (!fs.existsSync(APPROVED_PATH)) return []
  return fs.readFileSync(APPROVED_PATH, 'utf-8')
    .split('\n')
    .filter(line => line.trim())
    .map(line => JSON.parse(line))
}

export function auditGlossaryCompliance(text: string): { compliant: boolean; violations: string[] } {
  const glossary = getGlossaryTerms()
  const violations: string[] = []

  for (const [term, rule] of Object.entries(glossary)) {
    if (rule.forbidden && Array.isArray(rule.forbidden)) {
      for (const f of rule.forbidden) {
        if (text.includes(f)) {
          violations.push(`Term '${term}' used forbidden translation '${f}'`)
        }
      }
    }
  }

  return {
    compliant: violations.length === 0,
    violations,
  }
}

if (process.argv[1]?.endsWith('memory-manager.ts')) {
  console.log('=== Translation Memory & Glossary Overview ===')
  const terms = getGlossaryTerms()
  const approved = getApprovedMemory()
  console.log(`- Glossary Terms Count : ${Object.keys(terms).length}`)
  console.log(`- Approved Memory Lines : ${approved.length}`)
  console.log('Sample terms:')
  for (const [k, v] of Object.entries(terms).slice(0, 5)) {
    console.log(`  * ${k} -> ${v.preferred}`)
  }
}
