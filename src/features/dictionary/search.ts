import { removeToneMarks } from '../../lib/pinyin.ts'
import { getMeanings } from './dictionary.ts'
import type { Character, Word } from './types.ts'

/** Pinyin comparable: sin tonos, sin espacios y sin números de tono ("nǐ hǎo", "ni3hao3" → "nihao"). */
function normalizePinyin(text: string): string {
  return removeToneMarks(text).replace(/[\s\d]/g, '')
}

/**
 * ¿Coincide la entrada con lo que el usuario busca? Se puede buscar por
 * hanzi (好), por pinyin con o sin tonos (hǎo, hao, hao3) o por significado
 * en inglés (good).
 */
export function matchesSearch(entry: Character | Word, query: string): boolean {
  const text = query.trim().toLowerCase()
  if (text === '') return true
  if (entry.hanzi.includes(text)) return true

  const pinyinQuery = normalizePinyin(text)
  const readings = typeof entry.pinyin === 'string' ? [entry.pinyin] : entry.pinyin
  if (pinyinQuery !== '' && readings.some((reading) => normalizePinyin(reading).includes(pinyinQuery))) return true

  return getMeanings(entry.meanings).some((meaning) => meaning.toLowerCase().includes(text))
}
