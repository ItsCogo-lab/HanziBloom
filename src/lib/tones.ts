/**
 * Mandarin tones from pinyin with tone marks.
 *
 * 1-4 are the four tones (mā má mǎ mà) and 5 is the neutral tone (ma), which
 * is written without a mark in pinyin.
 */
export type Tone = 1 | 2 | 3 | 4 | 5

export const TONES: readonly Tone[] = [1, 2, 3, 4, 5]

/** Tone marks on each vowel: index 0 → tone 1, ..., index 3 → tone 4. */
const MARKED_VOWELS: readonly string[] = ['āēīōūǖ', 'áéíóúǘ', 'ǎěǐǒǔǚ', 'àèìòùǜ']

/**
 * Tone of a pinyin syllable: "hǎo" → 3, "ma" → 5.
 *
 * Returns `undefined` when it can't be known for sure, instead of guessing:
 * if it isn't a syllable (the lone "r" in 一会儿 yī huì r, which has no tone
 * of its own) or if it has more than one mark.
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
  // No mark: neutral tone, but only if it is a real syllable (has a vowel)
  return /[aeiouü]/.test(lower) ? 5 : undefined
}

/** Syllables of a space-separated pinyin: "nǐ hǎo" → ["nǐ", "hǎo"]. */
export function splitSyllables(pinyin: string): string[] {
  return pinyin.trim().split(/\s+/).filter((syllable) => syllable !== '')
}

const TONE_MARK_TO_PLAIN: Record<string, string> = Object.fromEntries(
  MARKED_VOWELS.flatMap((vowels) => [...vowels].map((marked, index) => [marked, 'aeiouü'[index]!])),
)

/**
 * Pinyin with the tone number after each syllable, as an alternative that
 * doesn't depend on seeing the marks: "nǐ hǎo" → "ni3 hao3", "xiè xie" → "xie4 xie5".
 * Anything that isn't a syllable is left as is.
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
