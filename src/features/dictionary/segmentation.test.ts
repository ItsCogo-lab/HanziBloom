import { describe, expect, it } from 'vitest'
import { createDictionary, type Dictionary } from './dictionary.ts'
import { segmentSentence, type WordIndex } from './segmentation.ts'
import { listStudyItems, type StudyItem } from './studyItem.ts'
import type { Character, Word } from './types.ts'

const character = (hanzi: string, pinyin: string[]): Character => ({ id: hanzi, hanzi, pinyin, meanings: { en: [] } })
const word = (hanzi: string, pinyin: string, id = hanzi): Word => ({ id, hanzi, pinyin, meanings: { en: [] } })

// 他被选为市长: every piece is a real CC-CEDICT entry
const dictionary = createDictionary(
  ['他', '被', '选', '为', '市', '长'].map((hanzi) => character(hanzi, [])),
  [
    word('选', 'xuǎn'),
    word('选为', 'xuǎn wéi'),
    word('市', 'shì'),
    word('市长', 'shì zhǎng'),
    word('长', 'cháng', '长[cháng]'),
    word('长', 'zhǎng', '长[zhǎng]'),
  ],
)

function createIndex(source: Dictionary): WordIndex {
  const items = listStudyItems(source)
  return {
    find: (hanzi) => items.filter((item) => item.entry.hanzi === hanzi),
    longest: () => Math.max(...items.map((item) => Array.from(item.entry.hanzi).length)),
  }
}

const label = (item: StudyItem | undefined) => item && `${item.kind}:${item.entry.id}`

describe('segmentSentence', () => {
  it('takes the longest entry at each point', () => {
    const words = segmentSentence('他被选为市长。', createIndex(dictionary))
    expect(words.map((piece) => piece.text)).toEqual(['他', '被', '选为', '市长', '。'])
    expect(words.map((piece) => label(piece.item))).toEqual([
      'character:他',
      'character:被',
      'word:选为',
      'word:市长',
      undefined,
    ])
  })

  it('joins everything that is not a word, including characters missing from the dictionary', () => {
    const words = segmentSentence('Tom说：他', createIndex(dictionary))
    expect(words).toEqual([{ text: 'Tom说：' }, { text: '他', item: expect.anything() }])
  })

  it('picks the homograph read like the sentence', () => {
    const index = createIndex(dictionary)
    expect(label(segmentSentence('他长', index, ['tā', 'zhǎng'])[1]?.item)).toBe('word:长[zhǎng]')
    expect(label(segmentSentence('他长', index, ['tā', 'cháng'])[1]?.item)).toBe('word:长[cháng]')
    // Without a reading, a single character opens its character entry
    expect(label(segmentSentence('他长', index, ['tā', undefined])[1]?.item)).toBe('character:长')
  })

  it('opens a single-character word read like the sentence', () => {
    expect(label(segmentSentence('选', createIndex(dictionary), ['xuǎn'])[0]?.item)).toBe('word:选')
  })
})
