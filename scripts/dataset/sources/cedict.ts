/**
 * Adaptador de CC-CEDICT (CC BY-SA 4.0), leído desde el paquete npm `cedict-json`.
 *
 * Responsabilidad: significados en inglés, lecturas de cada carácter y la
 * forma tradicional de cada palabra. No sabe nada de HSK ni de otras fuentes.
 */
import { numberedPinyinToToneMarks, removeToneMarks } from '../../../src/lib/pinyin.ts'

/** Una entrada tal como viene en `cedict.json`, con el pinyin ya en marcas de tono. */
export interface CedictEntry {
  traditional: string
  simplified: string
  pinyin: string
  english: string[]
}

/** Entradas de CC-CEDICT agrupadas por su forma simplificada. */
export type CedictIndex = ReadonlyMap<string, readonly CedictEntry[]>

/** Máximo de significados por entrada: los primeros de CC-CEDICT suelen ser los principales. */
const MAX_MEANINGS = 6

/**
 * Cuando CC-CEDICT tiene varias entradas con la misma lectura, se usan todas
 * en su orden. Aquí se elige una forma tradicional concreta cuando el orden
 * de CC-CEDICT pondría primero un sentido que no es el de HSK 1.
 */
const PREFERRED_TRADITIONAL: Record<string, string> = {
  // 里 "dentro" (裡) y no la unidad de longitud "li" (里)
  里: '裡',
  // Evitan las entradas de las variantes 妳 (nota sobre Taiwán) y 秊 (sentidos antiguos)
  你: '你',
  年: '年',
}

/** Significados que son notas de diccionario y no traducciones útiles para estudiar. */
const NON_TRANSLATION_MEANINGS = [
  /^(old |unofficial |archaic |erroneous )?variant of /i,
  /^see /i,
  /^used in /i,
  /^surname /i,
  /^\(surname\)/i,
  /^abbr\. for /i,
  /^CL:/,
  /^Taiwan pr\./i,
  /^also pr\./i,
  /^Kangxi radical/i,
]

/** Lee `cedict.json` y agrupa las entradas por simplificado, con el pinyin en marcas de tono. */
export function createCedictIndex(json: string): CedictIndex {
  const entries: CedictEntry[] = JSON.parse(json)
  const index = new Map<string, CedictEntry[]>()
  for (const entry of entries) {
    const toneMarked = { ...entry, pinyin: numberedPinyinToToneMarks(entry.pinyin) }
    const list = index.get(entry.simplified) ?? []
    list.push(toneMarked)
    index.set(entry.simplified, list)
  }
  return index
}

/**
 * Pinyin comparable: sin espacios, pero con tonos y mayúsculas. Las
 * mayúsculas importan: en CC-CEDICT marcan nombres propios (苹果 píng guǒ
 * "manzana" frente a Píng guǒ "Apple, la empresa").
 */
function comparablePinyin(pinyin: string): string {
  return pinyin.replace(/\s+/g, '')
}

/**
 * Limpia la notación interna de CC-CEDICT para que el texto se lea bien:
 * "(abbr. to 京[Jing1])" → "(abbr. to 京)", "兩|两[liang3]" → "两",
 * y quita las notas de clasificadores "(CL:...)" y de pronunciación en Taiwán.
 */
export function cleanMeaning(meaning: string): string {
  return meaning
    .replace(/\s*\((CL:|Taiwan pr\.)[^)]*\)/g, '')
    .replace(/\S+\|(\S+?)\[[^\]]+\]/g, '$1')
    .replace(/([㐀-鿿]+)\[[^\]]+\]/g, '$1')
    .replace(/\[([^\]]+)\]/g, (_match, pinyin: string) => numberedPinyinToToneMarks(pinyin))
    .trim()
}

function hasToneMark(syllable: string): boolean {
  return removeToneMarks(syllable) !== syllable.toLowerCase()
}

function isTranslation(meaning: string): boolean {
  return !NON_TRANSLATION_MEANINGS.some((pattern) => pattern.test(meaning))
}

/**
 * Significados útiles para estudiar. Si una lectura solo tiene notas (漂 piào:
 * "used in 漂亮"), se conservan las notas: dicen algo cierto y útil.
 */
export function usableMeanings(entries: readonly CedictEntry[]): string[] {
  const all = entries.flatMap((entry) => entry.english)
  const translations = all.filter(isTranslation)
  const meanings = (translations.length > 0 ? translations : all).map(cleanMeaning).filter((meaning) => meaning !== '')
  return [...new Set(meanings)].slice(0, MAX_MEANINGS)
}

/** Entradas de CC-CEDICT de un hanzi con una lectura concreta. */
export function findEntries(index: CedictIndex, hanzi: string, pinyin: string): CedictEntry[] {
  const entries = (index.get(hanzi) ?? []).filter(
    (entry) => comparablePinyin(entry.pinyin) === comparablePinyin(pinyin),
  )
  const preferred = PREFERRED_TRADITIONAL[hanzi]
  return preferred ? entries.filter((entry) => entry.traditional === preferred) : entries
}

/**
 * Forma tradicional de un grupo de entradas. Se ignoran las entradas que solo
 * son notas ("variant of 吃"), igual que al elegir los significados. Si aun
 * así CC-CEDICT da dos formas distintas, no se elige una a escondidas.
 */
export function traditionalOf(entries: readonly CedictEntry[]): string | undefined {
  const withTranslations = entries.filter((entry) => entry.english.some(isTranslation))
  const forms = new Set((withTranslations.length > 0 ? withTranslations : entries).map((entry) => entry.traditional))
  return forms.size === 1 ? [...forms][0] : undefined
}

/**
 * Lectura de un carácter tal como se usa en una palabra.
 *
 * Si en la palabra lleva tono neutro, se usa la entrada de CC-CEDICT con ese
 * tono neutro si existe (吗 ma, 们 men, 子 zi); si no, la lectura con tono
 * (东西 dōng xi → 西 xī), que es la del carácter aislado.
 */
export function readingOf(index: CedictIndex, hanzi: string, syllable: string): string | undefined {
  const candidates = (index.get(hanzi) ?? [])
    .map((entry) => entry.pinyin)
    .filter((pinyin) => pinyin === pinyin.toLowerCase())
  if (hasToneMark(syllable)) return candidates.find((pinyin) => pinyin === syllable)

  const sameSyllable = candidates.filter((pinyin) => removeToneMarks(pinyin) === syllable)
  return sameSyllable.find((pinyin) => pinyin === syllable) ?? sameSyllable[0]
}
