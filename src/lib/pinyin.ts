const TONE_MARKS: Record<string, readonly string[]> = {
  a: ['ā', 'á', 'ǎ', 'à'],
  e: ['ē', 'é', 'ě', 'è'],
  i: ['ī', 'í', 'ǐ', 'ì'],
  o: ['ō', 'ó', 'ǒ', 'ò'],
  u: ['ū', 'ú', 'ǔ', 'ù'],
  ü: ['ǖ', 'ǘ', 'ǚ', 'ǜ'],
}

/**
 * Converts a syllable with a numeric tone ("hao3", "lü4", "lu:4", "de5")
 * to pinyin with a tone mark ("hǎo", "lǜ", "lǜ", "de").
 *
 * Rule for where the mark goes: on the "a" or "e" if present; in "ou", on
 * the "o"; otherwise, on the last vowel.
 */
export function numberedSyllableToToneMarks(syllable: string): string {
  const match = /^([a-zü:]+)([1-5])$/i.exec(syllable.replace(/u:|v/gi, 'ü'))
  if (!match) return syllable

  const letters = match[1]!
  const tone = Number(match[2])
  if (tone === 5) return letters

  const lower = letters.toLowerCase()
  let index = lower.search(/[ae]/)
  if (index === -1) index = lower.indexOf('ou')
  if (index === -1) index = Math.max(...[...'iouü'].map((vowel) => lower.lastIndexOf(vowel)))
  if (index === -1) return letters

  const vowel = letters[index]!
  const marked = TONE_MARKS[vowel.toLowerCase()]![tone - 1]!
  const withCase = vowel === vowel.toUpperCase() ? marked.toUpperCase() : marked
  return letters.slice(0, index) + withCase + letters.slice(index + 1)
}

/** Converts multi-syllable numbered pinyin: "ni3 hao3" → "nǐ hǎo". */
export function numberedPinyinToToneMarks(pinyin: string): string {
  return pinyin.split(' ').map(numberedSyllableToToneMarks).join(' ')
}

/**
 * Removes tone marks and lowercases: "Nǐ hǎo" → "ni hao".
 * The "ü" is kept because it distinguishes syllables (lü ≠ lu).
 */
export function removeToneMarks(pinyin: string): string {
  return pinyin
    .toLowerCase()
    .replace(/[ǖǘǚǜ]/g, 'ü')
    .normalize('NFD')
    .replace(/(?!̈)[̀-ͯ]/g, '')
    .normalize('NFC')
}
