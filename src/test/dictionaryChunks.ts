import { getChunkIndex, type DictionaryChunk } from '../features/dictionary/fullDictionary.ts'
import type { LoadChunk } from '../features/dictionary/dictionaryStore.ts'
import type { Character, Word } from '../features/dictionary/types.ts'

/*
 * Entradas reales del diccionario completo (HanziDict 1.0.0), copiadas tal
 * cual: 企鹅 no está en HSK 1-4, ni sus caracteres 企 y 鹅.
 */
export const qiCharacter: Character = {
  id: '企',
  hanzi: '企',
  pinyin: ['qǐ'],
  meanings: { en: ['(bound form) to stand on tiptoe and look; to anticipate; to look forward to'] },
  strokeCount: 6,
  radical: '人',
  radicalNumber: 9,
  decomposition: '⿱人止',
  etymology: { type: 'ideographic', hint: 'A man 人 on his feet 止; 止 also provides the pronunciation' },
}

export const eCharacter: Character = {
  id: '鹅',
  hanzi: '鹅',
  pinyin: ['é'],
  meanings: { en: ['goose'] },
  strokeCount: 12,
  radical: '鸟',
  radicalNumber: 196,
  traditional: ['鵝'],
  decomposition: '⿰我鸟',
  etymology: { type: 'pictophonetic', hint: 'bird', semantic: '鸟', phonetic: '我' },
}

export const qieWord: Word = { id: '企鹅', hanzi: '企鹅', pinyin: 'qǐ é', meanings: { en: ['penguin'] }, traditional: '企鵝' }

/** Un diccionario completo de prueba, repartido en trozos como el de verdad. */
export function createChunkLoader(
  characters: readonly Character[] = [qiCharacter, eCharacter],
  words: readonly Word[] = [qieWord],
): LoadChunk & { requested: number[] } {
  const requested: number[] = []
  const load = async (index: number): Promise<DictionaryChunk> => {
    requested.push(index)
    return {
      characters: characters.filter((character) => getChunkIndex(character.hanzi) === index),
      words: words.filter((word) => getChunkIndex(word.hanzi) === index),
    }
  }
  return Object.assign(load, { requested })
}
