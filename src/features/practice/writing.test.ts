import { describe, expect, it } from 'vitest'
import type { StudyItem } from '../dictionary/studyItem.ts'
import type { Word } from '../dictionary/types.ts'
import { testWords } from '../dictionary/testData.ts'
import { createEmptyProgress, recordAnswer, recordWritingAnswer } from '../progress/progress.ts'
import type { ProgressData } from '../progress/types.ts'
import { canWrite, createWritingExercise, gradeWriting, isWritingDue, NO_HELP, selectWritingItems } from './writing.ts'

const monday = new Date(2026, 8, 28, 10, 0)
const thursday = new Date(2026, 9, 1, 10, 0)

function word(hanzi: string, meaning = 'something'): StudyItem {
  const entry: Word = { id: hanzi, hanzi, pinyin: 'x', meanings: { en: [meaning] }, hskLevel: 1 }
  return { kind: 'word', entry }
}

/** Answers `item` right `times` times in recognition. */
function readRight(item: StudyItem, times: number, progress = createEmptyProgress()): ProgressData {
  let result = progress
  for (let i = 0; i < times; i++) result = recordAnswer(result, `word:${item.entry.id}`, true, monday)
  return result
}

const thanks: StudyItem = { kind: 'word', entry: testWords[2]! } // 谢谢

describe('canWrite', () => {
  it('only once the item can be read: answered right at least once', () => {
    expect(canWrite(thanks, createEmptyProgress())).toBe(false)
    expect(canWrite(thanks, recordAnswer(createEmptyProgress(), 'word:谢谢', false, monday))).toBe(false)
    expect(canWrite(thanks, readRight(thanks, 1))).toBe(true)
  })

  it('only hanzi, at most 4 of them, and with a meaning to show', () => {
    for (const hanzi of ['AA制', '一石二鸟之计']) {
      const item = word(hanzi)
      expect(canWrite(item, readRight(item, 3))).toBe(false)
    }
    const quoting = word('大姐', 'see 大姐')
    expect(canWrite(quoting, readRight(quoting, 3))).toBe(false)
    const idiom = word('一石二鸟')
    expect(canWrite(idiom, readRight(idiom, 3))).toBe(true)
  })
})

describe('isWritingDue', () => {
  it('when never written, or when its writing review is due', () => {
    const progress = readRight(thanks, 1)
    expect(isWritingDue(thanks, progress, monday)).toBe(true)

    const written = recordWritingAnswer(progress, 'word:谢谢', true, monday) // next writing review: tomorrow
    expect(isWritingDue(thanks, written, monday)).toBe(false)
    expect(isWritingDue(thanks, written, thursday)).toBe(true)
  })

  it('never for an item that cannot be written yet', () => {
    expect(isWritingDue(thanks, createEmptyProgress(), monday)).toBe(false)
  })
})

describe('selectWritingItems', () => {
  const [hello, water, tea] = ['你好', '水', '茶'].map((hanzi) => word(hanzi))

  it('only items that can be written, due ones first, at most `size`', () => {
    let progress = readRight(hello!, 1, readRight(water!, 1, readRight(tea!, 1)))
    progress = recordWritingAnswer(progress, 'word:茶', true, monday) // 茶: next writing review tomorrow
    const unread = word('人')

    expect(selectWritingItems([unread, tea!, water!, hello!], progress, monday, 10)).toHaveLength(3)
    const firstTwo = selectWritingItems([tea!, water!, hello!], progress, monday, 2)
    expect(firstTwo.map((item) => item.entry.hanzi).sort()).toEqual(['你好', '水'])
  })

  it('prefers items the user studied over items only marked known by level', () => {
    const marked: ProgressData = {
      ...readRight(water!, 1),
      items: {
        ...readRight(water!, 1).items,
        'word:你好': { ...readRight(hello!, 5).items['word:你好']!, fromLevel: true },
      },
    }
    const [first] = selectWritingItems([hello!, water!], marked, monday, 1)
    expect(first?.entry.hanzi).toBe('水')
  })
})

describe('createWritingExercise', () => {
  it('a word sometimes asks for only one of its characters, picked at random', () => {
    expect(createWritingExercise(thanks, () => 0.9)).toEqual({ type: 'writing', item: thanks })
    const values = [0.1, 0.7]
    expect(createWritingExercise(thanks, () => values.shift()!)).toEqual({ type: 'writing', item: thanks, only: 1 })
  })

  it('a single character is always written whole', () => {
    const character: StudyItem = { kind: 'word', entry: { ...testWords[2]!, hanzi: '谢' } }
    expect(createWritingExercise(character, () => 0)).toEqual({ type: 'writing', item: character })
  })
})

describe('gradeWriting', () => {
  it('is correct only without help', () => {
    expect(gradeWriting(NO_HELP)).toBe(true)
    expect(gradeWriting({ ...NO_HELP, maxMissesOnStroke: 2 })).toBe(true)
    expect(gradeWriting({ ...NO_HELP, maxMissesOnStroke: 3 })).toBe(false)
    expect(gradeWriting({ ...NO_HELP, hintUsed: true })).toBe(false)
    expect(gradeWriting({ ...NO_HELP, revealed: true })).toBe(false)
  })
})
