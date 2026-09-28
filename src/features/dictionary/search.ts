import { removeToneMarks } from '../../lib/pinyin.ts'
import { getMeanings } from './dictionary.ts'
import type { StudyItem } from './studyItem.ts'
import type { Character, Word } from './types.ts'

/** Pinyin comparable: sin tonos, sin espacios y sin números de tono ("nǐ hǎo", "ni3 hao3" → "nihao"). */
function normalizePinyin(text: string): string {
  return removeToneMarks(text).replace(/[\s\d]/g, '')
}

const HAN = /\p{Script=Han}/u

/**
 * ¿Coincide la entrada con lo que el usuario busca? Se puede buscar por
 * hanzi (好), por pinyin con o sin tonos (hǎo, hao, hao3) o por significado
 * en inglés (good).
 */
export function matchesSearch(entry: Character | Word, query: string): boolean {
  return query.trim() === '' || getSearchRank(entry, query) !== undefined
}

/** Textos de una entrada ya preparados para comparar. Se calculan una vez por entrada. */
interface SearchFields {
  readings: string[]
  meanings: string[]
}

const searchFieldsCache = new WeakMap<Character | Word, SearchFields>()

function getSearchFields(entry: Character | Word): SearchFields {
  let fields = searchFieldsCache.get(entry)
  if (!fields) {
    const readings = typeof entry.pinyin === 'string' ? [entry.pinyin] : entry.pinyin
    fields = {
      readings: readings.map(normalizePinyin),
      meanings: getMeanings(entry.meanings).map((meaning) => meaning.toLowerCase()),
    }
    searchFieldsCache.set(entry, fields)
  }
  return fields
}

/**
 * Lo bien que coincide una entrada con la búsqueda: cuanto más bajo, mejor.
 * `undefined` si no coincide.
 *
 * 0. hanzi exacto (果)       1. empieza por él (果汁)      2. lo contiene (苹果)
 * 3. pinyin exacto (guo)    4. pinyin que empieza por él  5. pinyin que lo contiene
 * 6. significado que es exactamente eso ("apple") o lo tiene como palabra entera
 * 7. significado que lo contiene ("apples", "pineapple")
 */
export function getSearchRank(entry: Character | Word, query: string): number | undefined {
  const text = query.trim().toLowerCase()
  if (text === '') return undefined

  if (HAN.test(text)) {
    if (entry.hanzi === text) return 0
    if (entry.hanzi.startsWith(text)) return 1
    if (entry.hanzi.includes(text)) return 2
    return undefined
  }

  const { readings, meanings } = getSearchFields(entry)
  const pinyin = normalizePinyin(text)
  if (pinyin !== '') {
    if (readings.includes(pinyin)) return 3
    if (readings.some((reading) => reading.startsWith(pinyin))) return 4
    // Contener solo cuenta con 2 letras o más: si no, "a" coincidiría con casi todo
    if (pinyin.length > 1 && readings.some((reading) => reading.includes(pinyin))) return 5
  }

  const wholeWord = new RegExp(`(^|[^a-z])${escapeRegExp(text)}($|[^a-z])`)
  if (meanings.some((meaning) => meaning === text || wholeWord.test(meaning))) return 6
  if (meanings.some((meaning) => meaning.includes(text))) return 7
  return undefined
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Busca en el diccionario y ordena por lo bien que coincide (getSearchRank).
 * A igual coincidencia, primero los caracteres y luego las palabras, y cada
 * grupo por nivel HSK, en el orden del dataset. Todo es local: con unos
 * miles de entradas tarda milisegundos.
 */
export function searchItems(items: readonly StudyItem[], query: string, limit = Infinity): StudyItem[] {
  return items
    .map((item, index) => ({ item, index, rank: getSearchRank(item.entry, query) }))
    .filter((result) => result.rank !== undefined)
    .sort(
      (a, b) =>
        a.rank! - b.rank! ||
        kindOrder(a.item) - kindOrder(b.item) ||
        a.item.entry.hskLevel - b.item.entry.hskLevel ||
        a.index - b.index,
    )
    .slice(0, limit)
    .map((result) => result.item)
}

function kindOrder(item: StudyItem): number {
  return item.kind === 'character' ? 0 : 1
}
