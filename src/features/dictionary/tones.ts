import { getSyllableTone, splitSyllables, type Tone } from '../../lib/tones.ts'
import type { Character, Word } from './types.ts'

/**
 * Tono de cada carácter de una entrada, en orden. `undefined` donde no se
 * puede saber con seguridad; en ese caso el carácter se pinta sin color.
 *
 * - Palabras: el pinyin de la lista HSK tiene una sílaba por carácter
 *   (你好 → nǐ hǎo), así que cada carácter toma el tono de su sílaba en
 *   ESA palabra. Así un carácter con varias lecturas (长 cháng / zhǎng)
 *   se colorea según cómo se lee en cada palabra.
 * - Caracteres sueltos: si todas sus lecturas tienen el mismo tono, ese; si
 *   no (了: le, liǎo), no se elige ninguno.
 * - Si el número de sílabas no coincide con el de caracteres, ninguno.
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
