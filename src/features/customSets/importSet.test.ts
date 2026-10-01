import { describe, expect, it } from 'vitest'
import { createDictionary } from '../dictionary/dictionary.ts'
import type { WordIndex } from '../dictionary/segmentation.ts'
import { listStudyItems } from '../dictionary/studyItem.ts'
import type { Character, Word } from '../dictionary/types.ts'
import { MAX_IMPORT_ENTRIES, matchImport, normalizePinyin, parseImport } from './importSet.ts'

const character = (hanzi: string, pinyin: string[]): Character => ({ id: hanzi, hanzi, pinyin, meanings: { en: [] } })
const word = (hanzi: string, pinyin: string, id = hanzi): Word => ({ id, hanzi, pinyin, meanings: { en: [] } })

const dictionary = createDictionary(
  [character('长', ['cháng', 'zhǎng']), character('好', ['hǎo', 'hào'])],
  [
    word('苹果', 'píng guǒ'),
    word('香蕉', 'xiāng jiāo'),
    word('长', 'cháng', '长[cháng]'),
    word('长', 'zhǎng', '长[zhǎng]'),
  ],
)
const items = listStudyItems(dictionary)
const index: WordIndex = {
  find: (hanzi) => items.filter((item) => item.entry.hanzi === hanzi),
  longest: () => 2,
}

describe('parseImport', () => {
  it('reads the JSON format of the AI prompt, also inside a code block', () => {
    const text = '```json\n{"name": " Fruit ", "description": "Fruit words", "words": [{"hanzi": "苹果", "pinyin": "píng guǒ"}, "香蕉"]}\n```'
    expect(parseImport(text)).toEqual({
      parsed: {
        details: { name: 'Fruit', description: 'Fruit words' },
        entries: [{ hanzi: '苹果', pinyin: 'píng guǒ' }, { hanzi: '香蕉' }],
      },
    })
  })

  it('accepts a bare JSON array and skips entries without hanzi', () => {
    expect(parseImport('["苹果", {"hanzi": "apple"}, 3, {"pinyin": "x"}]')).toEqual({
      parsed: { details: {}, entries: [{ hanzi: '苹果' }] },
    })
  })

  it('reads a list or CSV: words per line, pinyin after a word, header and meanings ignored', () => {
    const text = 'hanzi,pinyin,meaning\n苹果,píng guǒ,apple\n香蕉\tbanana\n长 zhang3\n好，苹果、香蕉\n\n'
    expect(parseImport(text)).toEqual({
      parsed: {
        details: {},
        entries: [
          { hanzi: '苹果', pinyin: 'píng guǒ' },
          { hanzi: '香蕉', pinyin: 'banana' },
          { hanzi: '长', pinyin: 'zhang3' },
          { hanzi: '好' },
          { hanzi: '苹果' },
          { hanzi: '香蕉' },
        ],
      },
    })
  })

  it('reports what is wrong with the text', () => {
    expect(parseImport('  ')).toEqual({ problem: 'empty' })
    expect(parseImport('{"words": [苹果]}')).toEqual({ problem: 'invalidJson' })
    expect(parseImport('{"name": "No words"}')).toEqual({ problem: 'invalidJson' })
    expect(parseImport('apple, banana')).toEqual({ problem: 'noEntries' })
    expect(parseImport('好\n'.repeat(MAX_IMPORT_ENTRIES + 1))).toEqual({ problem: 'tooManyEntries' })
  })
})

describe('matchImport', () => {
  it('finds words in order, without repeats, and lists the missing ones', () => {
    const entries = [{ hanzi: '香蕉' }, { hanzi: '苹果' }, { hanzi: '香蕉' }, { hanzi: '火龙果' }]
    expect(matchImport(entries, index)).toEqual({
      itemIds: ['word:香蕉', 'word:苹果'],
      notFound: [{ hanzi: '火龙果' }],
    })
  })

  it('uses the pinyin to pick among homographs, with or without tones', () => {
    expect(matchImport([{ hanzi: '长', pinyin: 'zhǎng' }], index).itemIds).toEqual(['word:长[zhǎng]'])
    expect(matchImport([{ hanzi: '长', pinyin: 'zhang3' }], index).itemIds).toEqual(['word:长[zhǎng]'])
    expect(matchImport([{ hanzi: '长', pinyin: 'zhang' }], index).itemIds).toEqual(['word:长[zhǎng]'])
  })

  it('prefers a word, keeps the word if the pinyin is wrong, and falls back to the character', () => {
    expect(matchImport([{ hanzi: '长' }], index).itemIds).toEqual(['word:长[cháng]'])
    expect(matchImport([{ hanzi: '苹果', pinyin: 'banana' }], index).itemIds).toEqual(['word:苹果'])
    expect(matchImport([{ hanzi: '好', pinyin: 'hào' }], index).itemIds).toEqual(['char:好'])
  })
})

describe('normalizePinyin', () => {
  it('compares marks, numbers, case and spacing alike', () => {
    expect(normalizePinyin('Píng guǒ')).toBe('píngguǒ')
    expect(normalizePinyin('ping2 guo3')).toBe('píngguǒ')
    expect(normalizePinyin('ping2guo3')).toBe('píngguǒ')
    expect(normalizePinyin('lv4')).toBe('lǜ')
  })
})
