import { describe, expect, it } from 'vitest'
import { memoryStorage } from '../../test/memoryStorage.ts'
import { addSet, createEmptyMyStudies, getRecentlyStudied, isStudying, markSetStudied, removeSet } from './myStudies.ts'
import { loadMyStudies, saveMyStudies } from './storage.ts'

const monday = new Date('2026-09-28T10:00:00Z')
const tuesday = new Date('2026-09-29T10:00:00Z')

describe('My Studies', () => {
  it('adds and removes sets', () => {
    let studies = addSet(createEmptyMyStudies(), 'hsk-1', monday)
    studies = addSet(studies, 'topic-food', monday)
    expect(studies.sets.map((set) => set.setId)).toEqual(['hsk-1', 'topic-food'])
    expect(isStudying(studies, 'hsk-1')).toBe(true)

    studies = removeSet(studies, 'hsk-1')
    expect(isStudying(studies, 'hsk-1')).toBe(false)
    expect(studies.sets.map((set) => set.setId)).toEqual(['topic-food'])
  })

  it("doesn't duplicate a set already added", () => {
    const studies = addSet(addSet(createEmptyMyStudies(), 'hsk-1', monday), 'hsk-1', tuesday)
    expect(studies.sets).toEqual([{ setId: 'hsk-1', addedAt: monday.toISOString() }])
  })

  it('records when each set was studied and lists the most recent first', () => {
    let studies = markSetStudied(createEmptyMyStudies(), 'hsk-1', monday)
    studies = markSetStudied(studies, 'topic-food', tuesday)
    expect(getRecentlyStudied(studies).map((entry) => entry.setId)).toEqual(['topic-food', 'hsk-1'])

    studies = markSetStudied(studies, 'hsk-1', new Date('2026-09-30T10:00:00Z'))
    expect(getRecentlyStudied(studies, 1)).toEqual([{ setId: 'hsk-1', studiedAt: '2026-09-30T10:00:00.000Z' }])
  })

  it("removing a set doesn't clear when it was studied", () => {
    const studies = removeSet(markSetStudied(addSet(createEmptyMyStudies(), 'hsk-1', monday), 'hsk-1', monday), 'hsk-1')
    expect(getRecentlyStudied(studies)).toHaveLength(1)
  })
})

describe('My Studies storage', () => {
  it('saves and loads', () => {
    const storage = memoryStorage()
    const studies = markSetStudied(addSet(createEmptyMyStudies(), 'hsk-2', monday), 'hsk-2', tuesday)
    saveMyStudies(studies, storage)
    expect(loadMyStudies(storage)).toEqual(studies)
  })

  it('discards anything without the expected format', () => {
    const storage = memoryStorage({
      'hanzivocab.studies': JSON.stringify({
        version: 1,
        sets: [{ setId: 'hsk-1', addedAt: 'x' }, { setId: 3 }, { setId: 'hsk-1', addedAt: 'y' }],
        lastStudied: { 'hsk-1': 'z', broken: 5 },
      }),
    })
    expect(loadMyStudies(storage)).toEqual({ sets: [{ setId: 'hsk-1', addedAt: 'x' }], lastStudied: { 'hsk-1': 'z' } })
  })

  it('starts empty with no data or another version', () => {
    expect(loadMyStudies(memoryStorage())).toEqual(createEmptyMyStudies())
    const storage = memoryStorage({ 'hanzivocab.studies': JSON.stringify({ version: 99, sets: [] }) })
    expect(loadMyStudies(storage)).toEqual(createEmptyMyStudies())
  })
})
