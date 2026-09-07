export const DictId = {
  wordCollect: 'wordCollect',
  wordWrong: 'wordWrong',
  wordKnown: 'wordKnown',
  articleCollect: 'articleCollect',
} as const

export type DictIdType = (typeof DictId)[keyof typeof DictId]

export function createDefaultDict(val: Record<string, any> = {}) {
  return {
    id: '',
    name: '',
    description: '',
    url: '',
    length: 0,
    category: '',
    tags: [] as string[],
    translateLanguage: '',
    type: 'word',
    language: 'en',
    lastLearnIndex: 0,
    perDayStudyNumber: 20,
    custom: false,
    system: false,
    sourceId: '',
    complete: false,
    createdBy: '',
    enName: '',
    category_id: null,
    is_default: false,
    update: false,
    cover: '',
    sync: false,
    words: [] as any[],
    articles: [] as any[],
    statistics: [] as any[],
    ...val,
  }
}

export function getDefaultSystemWordBooks() {
  return [
    createDefaultDict({ id: DictId.wordCollect, enName: DictId.wordCollect, name: '', system: true }),
    createDefaultDict({ id: DictId.wordWrong, enName: DictId.wordWrong, name: '', system: true }),
    createDefaultDict({
      id: DictId.wordKnown,
      enName: DictId.wordKnown,
      name: '',
      description: '',
      system: true,
    }),
  ]
}

export function getDefaultSystemArticleBooks() {
  return [
    createDefaultDict({ id: DictId.articleCollect, enName: DictId.articleCollect, name: '', system: true }),
  ]
}

export function getBookName(
  book: Partial<Record<string, any>> | null | undefined,
  $t?: (key: string, ...args: any[]) => string
): string {
  if (!book) return ''
  const id = (book.id || book.enName) as string | undefined
  if (id && [DictId.wordCollect, DictId.wordWrong, DictId.wordKnown, DictId.articleCollect].includes(id as any)) {
    if ($t) {
      const translated = $t(`books.${id}`)
      if (translated && translated !== `books.${id}`) {
        return translated
      }
    }
  }
  if (book.name === '收藏') {
    return $t ? $t('books.wordCollect') : 'Yêu thích'
  }
  if (book.name === '错词') {
    return $t ? $t('books.wordWrong') : 'Từ hay sai'
  }
  if (book.name === '已掌握') {
    return $t ? $t('books.wordKnown') : 'Đã thành thạo'
  }
  return String(book.name || (id && $t ? $t(`books.${id}`) : '') || '')
}

export function getBookDescription(
  book: Partial<Record<string, any>> | null | undefined,
  $t?: (key: string, ...args: any[]) => string
): string {
  if (!book) return ''
  const id = (book.id || book.enName) as string | undefined
  if (id === DictId.wordKnown) {
    if ($t) {
      const desc = $t('books.wordKnown_desc')
      if (desc && desc !== 'books.wordKnown_desc') return desc
    }
  }
  return String(book.description || '')
}

export function normalizeLegacySystemBook(val: any, type: 'word' | 'article' = 'word'): any {
  const next = { ...(val ?? {}) }
  const idStr = String(next.id ?? '')
  const enNameStr = String(next.enName ?? next.en_name ?? '')
  const nameStr = String(next.name ?? '').trim()

  if (type === 'word') {
    if (
      idStr === DictId.wordCollect ||
      enNameStr === DictId.wordCollect ||
      idStr === '收藏' ||
      nameStr === '收藏' ||
      nameStr.toLowerCase() === 'favorites' ||
      nameStr === 'Yêu thích'
    ) {
      next.id = DictId.wordCollect
      next.enName = DictId.wordCollect
      next.system = true
      next.name = ''
    } else if (
      idStr === DictId.wordWrong ||
      enNameStr === DictId.wordWrong ||
      idStr === '错词' ||
      nameStr === '错词' ||
      nameStr.toLowerCase() === 'wrong words' ||
      nameStr === 'Từ sai' ||
      nameStr === 'Từ hay sai'
    ) {
      next.id = DictId.wordWrong
      next.enName = DictId.wordWrong
      next.system = true
      next.name = ''
    } else if (
      idStr === DictId.wordKnown ||
      enNameStr === DictId.wordKnown ||
      idStr === '已掌握' ||
      nameStr === '已掌握' ||
      nameStr.toLowerCase() === 'mastered' ||
      nameStr === 'Đã thuộc' ||
      nameStr === 'Đã thành thạo'
    ) {
      next.id = DictId.wordKnown
      next.enName = DictId.wordKnown
      next.system = true
      next.name = ''
      next.description = ''
    }
  } else {
    if (
      idStr === DictId.articleCollect ||
      enNameStr === DictId.articleCollect ||
      idStr === '收藏' ||
      nameStr === '收藏' ||
      nameStr.toLowerCase() === 'favorites' ||
      nameStr === 'Yêu thích'
    ) {
      next.id = DictId.articleCollect
      next.enName = DictId.articleCollect
      next.system = true
      next.name = ''
    }
  }

  const systemIds = [DictId.wordCollect, DictId.wordWrong, DictId.wordKnown, DictId.articleCollect]
  if (systemIds.includes(next.id) || systemIds.includes(next.enName)) {
    next.system = true
    next.name = ''
    if (next.id === DictId.wordKnown || next.enName === DictId.wordKnown) {
      next.description = ''
    }
  }

  if (!next.enName && next.en_name) {
    next.enName = next.en_name
  }
  if (!next.enName && !next.en_name) {
    next.enName = String(next.id)
  }
  if (Array.isArray(next.words)) {
    next.length = next.words.length
  }
  if (Array.isArray(next.articles)) {
    next.length = next.articles.length
  }
  return createDefaultDict(next)
}

export function normalizeWordBookList(bookList: any[] = []): any[] {
  const defaultWordBooks = getDefaultSystemWordBooks()
  const systemMap = new Map<string, any>()
  for (const b of defaultWordBooks) {
    systemMap.set(b.id, { ...b, words: [...(b.words || [])] })
  }
  const customBooks: any[] = []

  for (const raw of bookList) {
    const norm = normalizeLegacySystemBook(raw, 'word')
    if (systemMap.has(norm.id)) {
      const target = systemMap.get(norm.id)!
      if (Array.isArray(norm.words) && norm.words.length) {
        const existingWords = new Set(target.words.map((w: any) => (typeof w === 'string' ? w : w.word)))
        for (const w of norm.words) {
          const wStr = typeof w === 'string' ? w : w.word
          if (!existingWords.has(wStr)) {
            existingWords.add(wStr)
            target.words.push(w)
          }
        }
        target.length = target.words.length
      }
      if (norm.lastLearnIndex !== undefined) target.lastLearnIndex = norm.lastLearnIndex
      if (norm.perDayStudyNumber !== undefined) target.perDayStudyNumber = norm.perDayStudyNumber
      if (norm.complete !== undefined) target.complete = norm.complete
    } else {
      customBooks.push(norm)
    }
  }

  return [...systemMap.values(), ...customBooks]
}

export function normalizeArticleBookList(bookList: any[] = []): any[] {
  const defaultArticleBooks = getDefaultSystemArticleBooks()
  const systemMap = new Map<string, any>()
  for (const b of defaultArticleBooks) {
    systemMap.set(b.id, { ...b, articles: [...(b.articles || [])] })
  }
  const customBooks: any[] = []

  for (const raw of bookList) {
    const norm = normalizeLegacySystemBook(raw, 'article')
    if (systemMap.has(norm.id)) {
      const target = systemMap.get(norm.id)!
      if (Array.isArray(norm.articles) && norm.articles.length) {
        const existingArticles = new Set(target.articles.map((a: any) => (typeof a === 'string' ? a : a.title || a.id)))
        for (const a of norm.articles) {
          const aKey = typeof a === 'string' ? a : a.title || a.id
          if (!existingArticles.has(aKey)) {
            existingArticles.add(aKey)
            target.articles.push(a)
          }
        }
        target.length = target.articles.length
      }
      if (norm.lastLearnIndex !== undefined) target.lastLearnIndex = norm.lastLearnIndex
      if (norm.perDayStudyNumber !== undefined) target.perDayStudyNumber = norm.perDayStudyNumber
      if (norm.complete !== undefined) target.complete = norm.complete
    } else {
      customBooks.push(norm)
    }
  }

  return [...systemMap.values(), ...customBooks]
}

export function migrateSaveDict(state: any): any {
  if (!state || typeof state !== 'object') return state
  const next = { ...state }

  if (next.word) {
    next.word = {
      ...next.word,
      bookList: normalizeWordBookList(next.word.bookList || []),
    }
  }

  if (next.article) {
    next.article = {
      ...next.article,
      bookList: normalizeArticleBookList(next.article.bookList || []),
    }
  }

  // Preserve fsrsData and noteData
  next.fsrsData = next.fsrsData ?? {}
  next.noteData = next.noteData ?? {}

  return next
}
