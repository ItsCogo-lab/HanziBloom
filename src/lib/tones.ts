/**
 * Tonos del mandarín a partir del pinyin con marcas de tono.
 *
 * 1-4 son los cuatro tonos (mā má mǎ mà) y 5 el tono neutro (ma), que en
 * pinyin se escribe sin marca.
 */
export type Tone = 1 | 2 | 3 | 4 | 5

export const TONES: readonly Tone[] = [1, 2, 3, 4, 5]

/** Marcas de tono sobre cada vocal: índice 0 → tono 1, ..., índice 3 → tono 4. */
const MARKED_VOWELS: readonly string[] = ['āēīōūǖ', 'áéíóúǘ', 'ǎěǐǒǔǚ', 'àèìòùǜ']

/**
 * Tono de una sílaba de pinyin: "hǎo" → 3, "ma" → 5.
 *
 * Devuelve `undefined` si no se puede saber con seguridad, en lugar de
 * adivinar: si no es una sílaba (la "r" suelta de 一会儿 yī huì r, que no
 * tiene tono propio) o si tiene más de una marca.
 */
export function getSyllableTone(syllable: string): Tone | undefined {
  const lower = syllable.toLowerCase()
  if (!/^[a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]+$/.test(lower)) return undefined

  const tones = [...lower].flatMap((letter) => {
    const index = MARKED_VOWELS.findIndex((vowels) => vowels.includes(letter))
    return index === -1 ? [] : [(index + 1) as Tone]
  })
  if (tones.length > 1) return undefined
  if (tones.length === 1) return tones[0]
  // Sin marca: tono neutro, pero solo si es una sílaba de verdad (tiene vocal)
  return /[aeiouü]/.test(lower) ? 5 : undefined
}

/** Sílabas de un pinyin separado por espacios: "nǐ hǎo" → ["nǐ", "hǎo"]. */
export function splitSyllables(pinyin: string): string[] {
  return pinyin.trim().split(/\s+/).filter((syllable) => syllable !== '')
}

const TONE_MARK_TO_PLAIN: Record<string, string> = Object.fromEntries(
  MARKED_VOWELS.flatMap((vowels) => [...vowels].map((marked, index) => [marked, 'aeiouü'[index]!])),
)

/**
 * Pinyin con el número de tono detrás de cada sílaba, como alternativa que
 * no depende de ver las marcas: "nǐ hǎo" → "ni3 hao3", "xiè xie" → "xie4 xie5".
 * Lo que no es una sílaba se deja tal cual.
 */
export function toToneNumbers(pinyin: string): string {
  return pinyin
    .split(/(\s+)/)
    .map((part) => {
      const tone = getSyllableTone(part)
      if (tone === undefined) return part
      return [...part].map((letter) => TONE_MARK_TO_PLAIN[letter.toLowerCase()] ?? letter).join('') + tone
    })
    .join('')
}
