import { describe, expect, it } from 'vitest'
import type { StudyItem } from '../dictionary/studyItem.ts'
import type { Word } from '../dictionary/types.ts'
import { testWords } from '../dictionary/testData.ts'
import { createEmptyProgress, recordAnswer, recordWritingAnswer } from '../progress/progress.ts'
import type { ProgressData } from '../progress/types.ts'
import { canWrite, gradeWriting, isWritingDue, NO_HELP } from './writing.ts'

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
  it('only once the item can be read: recognition level 2 or more', () => {
    expect(canWrite(thanks, readRight(thanks, 1))).toBe(false)
    expect(canWrite(thanks, readRight(thanks, 2))).toBe(true)
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
    const progress = readRight(thanks, 2)
    expect(isWritingDue(thanks, progress, monday)).toBe(true)

    const written = recordWritingAnswer(progress, 'word:谢谢', true, monday) // next writing review: tomorrow
    expect(isWritingDue(thanks, written, monday)).toBe(false)
    expect(isWritingDue(thanks, written, thursday)).toBe(true)
  })

  it('never for an item that cannot be written yet', () => {
    expect(isWritingDue(thanks, createEmptyProgress(), monday)).toBe(false)
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
