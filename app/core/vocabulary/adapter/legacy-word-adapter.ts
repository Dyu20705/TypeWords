/**
 * legacy-word-adapter.ts
 *
 * ARCHITECTURAL NOTICE (ADR-002):
 * This module is a TRANSITIONAL COMPATIBILITY LAYER.
 * It adapts between the modern canonical `VocabularyEntry` schema and the legacy
 * TypeWords runtime format (`Word` with `cn` / `cn_source` fields).
 *
 * Exit Criterion:
 * Once UI components in `app/components/` and `app/pages/` are fully upgraded
 * to natively consume `VocabularyEntry.definitions[].vi`, this adapter will be retired.
 */

export interface VocabularyMeaning {
  pos: string
  vi: string
  en?: string
  zh?: string
  context?: string
  provenance?: {
    method?: 'tm' | 'glossary' | 'llm' | 'manual'
    source?: string
    reviewStatus?: 'approved' | 'pending' | 'rejected'
  }
}

export interface VocabularyExample {
  en: string
  vi?: string
  zh?: string
}

export interface VocabularyPhrase {
  phrase: string
  vi?: string
  zh?: string
}

export interface VocabularyEntry {
  id: string | number
  word: string
  normalizedWord: string
  phonetic?: {
    uk?: string
    us?: string
  }
  definitions: VocabularyMeaning[]
  examples?: VocabularyExample[]
  phrases?: VocabularyPhrase[]
  synonyms?: {
    pos: string
    words: string[]
    vi?: string
  }[]
  metadata?: {
    source?: string
    level?: string
    tags?: string[]
    frequency?: number
    updatedAt?: string
  }
}

export interface LegacyWord {
  id?: string | number
  word: string
  phonetic0: string
  phonetic1: string
  trans: {
    pos: string
    cn: string
    cn_source?: string
  }[]
  sentences: {
    c: string
    cn: string
    cn_source?: string
  }[]
  phrases: {
    c: string
    cn: string
  }[]
  synos?: {
    pos: string
    cn: string
    cn_source?: string
    ws: string[]
  }[]
  relWords?: {
    root: string
    rels: {
      pos: string
      words: { c: string; cn: string; cn_source?: string }[]
    }[]
  }
}

const CHINESE_REGEX = /[\u4e00-\u9fff\u3400-\u4dbf]/

export function normalizePosTag(pos: string): string {
  const p = pos.trim().toLowerCase()
  if (!p) return ''
  if (p === 'a.' || p === 'a') return 'adj.'
  if (p === 'ad.' || p === 'ad') return 'adv.'
  if (p === 'n' || p === 'noun') return 'n.'
  if (p === 'v' || p === 'verb') return 'v.'
  if (p === 'phrase.') return 'phrase'
  if (p === 'phr.') return 'phrase'
  if (p === 'pronoun.') return 'pron.'
  if (p === 'contr.') return 'abbr.'
  return p
}

/**
 * Converts modern canonical VocabularyEntry to legacy Word structure for UI consumption.
 */
export function adaptVocabularyEntryToLegacyWord(entry: VocabularyEntry): LegacyWord {
  return {
    id: entry.id,
    word: entry.word,
    phonetic0: entry.phonetic?.uk || '',
    phonetic1: entry.phonetic?.us || '',
    trans: (entry.definitions || []).map(def => ({
      pos: def.pos || '',
      cn: (def.vi && !CHINESE_REGEX.test(def.vi)) ? def.vi : '',
      cn_source: def.zh || '',
    })),
    sentences: (entry.examples || []).map(ex => ({
      c: ex.en || '',
      cn: (ex.vi && !CHINESE_REGEX.test(ex.vi)) ? ex.vi : '',
      cn_source: ex.zh || '',
    })),
    phrases: (entry.phrases || []).map(ph => ({
      c: ph.phrase || '',
      cn: (ph.vi && !CHINESE_REGEX.test(ph.vi)) ? ph.vi : '',
      cn_source: ph.zh || '',
    })),
    synos: (entry.synonyms || []).map(syn => ({
      pos: syn.pos || '',
      cn: (syn.vi && !CHINESE_REGEX.test(syn.vi)) ? syn.vi : '',
      cn_source: syn.zh || '',
      ws: syn.words || [],
    })),
  }
}

/**
 * Converts legacy Word structure to modern canonical VocabularyEntry.
 */
export function adaptLegacyWordToVocabularyEntry(legacy: LegacyWord, sourceName?: string): VocabularyEntry {
  const wordStr = String(legacy.word || '').trim()
  const normalized = wordStr.toLowerCase()
  const hasValidId = legacy.id !== undefined && legacy.id !== null && legacy.id !== ''

  let lastPos = ''
  const definitions: VocabularyMeaning[] = (legacy.trans || []).map(t => {
    const isChinese = CHINESE_REGEX.test(t.cn || '')
    let pos = normalizePosTag(t.pos || '')
    if (!pos) {
      const text = (t.cn || t.cn_source || '').trim()
      if (text.startsWith('\u3010\u540d\u3011')) {
        pos = 'n.'
      } else if (text.startsWith('\u3010\u52a8\u3011')) {
        pos = 'v.'
      } else if (text.startsWith('\u3010\u5f62\u3011')) {
        pos = 'adj.'
      } else if (text.startsWith('\u3010\u526f\u3011')) {
        pos = 'adv.'
      } else {
        const match = text.match(/^[-\s]*(n|v|vt|vi|adj|a|adv|ad|prep|conj|pron|num|int|abbr)[\.．]/i)
        if (match) {
          let m = match[1].toLowerCase()
          if (m === 'a') m = 'adj'
          if (m === 'ad') m = 'adv'
          pos = m + '.'
        } else if (lastPos) {
          pos = lastPos
        } else if (wordStr.includes(' ')) {
          pos = 'phrase'
        } else if (sourceName?.toLowerCase().includes('807')) {
          pos = 'n.'
        } else if (text.endsWith('\u7684')) {
          pos = 'adj.'
        } else if (text.endsWith('\u5730')) {
          pos = 'adv.'
        }
      }
    }
    if (pos) lastPos = pos

    return {
      pos: pos || '',
      vi: t.cn || '',
      zh: isChinese ? (t.cn || '') : (t.cn_source || ''),
      provenance: {
        method: 'manual',
        source: sourceName || 'legacy-runtime',
        reviewStatus: isChinese ? 'pending' : 'approved',
      },
    }
  })

  const examples: VocabularyExample[] = (legacy.sentences || [])
    .filter(s => s && typeof s.c === 'string' && s.c.trim().length > 0)
    .map(s => {
      const isChinese = CHINESE_REGEX.test(s.cn || '')
      const ex: VocabularyExample = {
        en: s.c.trim(),
      }
      if (isChinese) {
        ex.zh = (s.cn || '').trim()
      } else if (s.cn && s.cn.trim().length > 0) {
        ex.vi = s.cn.trim()
      }
      if (s.cn_source && s.cn_source.trim().length > 0 && !ex.zh) {
        ex.zh = s.cn_source.trim()
      }
      return ex
    })

  const phrases: VocabularyPhrase[] = (legacy.phrases || [])
    .filter(p => p && typeof p.c === 'string' && p.c.trim().length > 0)
    .map(p => {
      const isChinese = CHINESE_REGEX.test(p.cn || '')
      const ph: VocabularyPhrase = {
        phrase: p.c.trim(),
      }
      if (isChinese) {
        ph.zh = (p.cn || '').trim()
      } else if (p.cn && p.cn.trim().length > 0) {
        ph.vi = p.cn.trim()
      }
      return ph
    })

  const synonyms = (legacy.synos || [])
    .filter(s => s && Array.isArray(s.ws) && s.ws.length > 0)
    .map(s => {
      const isChinese = CHINESE_REGEX.test(s.cn || '')
      const syn: { pos: string; words: string[]; vi?: string } = {
        pos: normalizePosTag(s.pos || '') || (s.pos || '').trim(),
        words: s.ws.map((w: any) => String(w).trim()).filter(Boolean),
      }
      if (!isChinese && s.cn && s.cn.trim().length > 0) {
        syn.vi = s.cn.trim()
      }
      return syn
    })

  return {
    id: hasValidId ? legacy.id! : normalized,
    word: wordStr,
    normalizedWord: normalized,
    phonetic: {
      uk: legacy.phonetic0 || '',
      us: legacy.phonetic1 || '',
    },
    definitions,
    ...(examples.length > 0 ? { examples } : {}),
    ...(phrases.length > 0 ? { phrases } : {}),
    ...(synonyms.length > 0 ? { synonyms } : {}),
    metadata: {
      source: sourceName || '',
      updatedAt: new Date().toISOString(),
    },
  }
}
