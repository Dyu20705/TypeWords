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
      cn: def.vi || '',
      cn_source: def.zh || '',
    })),
    sentences: (entry.examples || []).map(ex => ({
      c: ex.en || '',
      cn: ex.vi || '',
      cn_source: ex.zh || '',
    })),
    phrases: (entry.phrases || []).map(ph => ({
      c: ph.phrase || '',
      cn: ph.vi || '',
    })),
    synos: (entry.synonyms || []).map(syn => ({
      pos: syn.pos || '',
      cn: syn.vi || '',
      ws: syn.words || [],
    })),
  }
}

/**
 * Converts legacy Word structure to modern canonical VocabularyEntry.
 */
export function adaptLegacyWordToVocabularyEntry(legacy: LegacyWord, sourceName?: string): VocabularyEntry {
  const normalized = String(legacy.word || '').trim().toLowerCase()
  const hasValidId = legacy.id !== undefined && legacy.id !== null && legacy.id !== ''
  return {
    id: hasValidId ? legacy.id! : normalized,
    word: String(legacy.word || '').trim(),
    normalizedWord: normalized,
    phonetic: {
      uk: legacy.phonetic0 || '',
      us: legacy.phonetic1 || '',
    },
    definitions: (legacy.trans || []).map(t => ({
      pos: t.pos || '',
      vi: t.cn || '',
      zh: t.cn_source || '',
      provenance: {
        method: 'manual',
        source: sourceName || 'legacy-runtime',
        reviewStatus: 'approved',
      },
    })),
    examples: (legacy.sentences || []).map(s => ({
      en: s.c || '',
      vi: s.cn || '',
      zh: s.cn_source || '',
    })),
    phrases: (legacy.phrases || []).map(p => ({
      phrase: p.c || '',
      vi: p.cn || '',
    })),
    synonyms: (legacy.synos || []).map(s => ({
      pos: s.pos || '',
      words: s.ws || [],
      vi: s.cn || '',
    })),
    metadata: {
      source: sourceName || '',
      updatedAt: new Date().toISOString(),
    },
  }
}
