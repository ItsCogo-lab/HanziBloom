import { getSyllableTone, splitSyllables, type Tone } from '../../lib/tones.ts'
import type { Character, Word } from './types.ts'

/**
 * Tone of each character in an entry, in order. `undefined` where it can't
 * be known for sure; in that case the character is drawn without color.
 *
 * - Words: the HSK list pinyin has one syllable per character
 *   (你好 → nǐ hǎo), so each character takes the tone of its syllable in
 *   THAT word. That way a character with several readings (长 cháng / zhǎng)
 *   is colored according to how it's read in each word.
 * - Standalone characters: if all their readings have the same tone, that one;
 *   if not (了: le, liǎo), none is chosen.
 * - If the number of syllables doesn't match the number of characters, none.
 */
export function getCharacterTones(entry: Character | Word): (Tone | undefined)[] {
  const characters = Array.from(entry.hanzi)

  if (typeof entry.pinyin !== 'string') {
    const tones = new Set(entry.pinyin.map(getSyllableTone))
    const [tone] = tones
    return characters.map(() => (tones.size === 1 ? tone : undefined))
  }

  const syllables = splitSyllables(entry.pinyin)
  if (syllables.length !== characters.length) return characters.map(() => undefined)
  return syllables.map(getSyllableTone)
}
