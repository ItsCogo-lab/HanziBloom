import { describe, expect, it } from 'vitest'
import {
  addItem,
  createCustomSet,
  deleteCustomSet,
  deleteMeaning,
  removeItem,
  setMeaning,
  validateMeaning,
  toStudySet,
  updateCustomSet,
  validateDetails,
} from './customSets.ts'
import { loadCustomSets, saveCustomSets } from './storage.ts'
import { memoryStorage } from '../../test/memoryStorage.ts'

const now = new Date(2026, 8, 28, 12)
const later = new Date(2026, 8, 29, 12)

describe('custom sets', () => {
  it('validates the name and trims whitespace', () => {
    expect(validateDetails({ name: '  My Chinese ', description: ' ' })).toEqual({
      details: { name: 'My Chinese', description: '' },
    })
    expect(validateDetails({ name: '   ', description: '' })).toEqual({ problem: 'emptyName' })
    expect(validateDetails({ name: 'x'.repeat(61), description: '' })).toEqual({ problem: 'nameTooLong' })
  })

  it('creates an empty set and renames it without touching the others', () => {
    const travel = createCustomSet({ name: 'Travel', description: '' }, 'custom-a', now)
    const exam = createCustomSet({ name: 'Exam', description: 'HSK 3' }, 'custom-b', now)
    expect(travel).toMatchObject({ id: 'custom-a', name: 'Travel', itemIds: [] })

    const renamed = updateCustomSet([travel, exam], 'custom-a', later, (set) => ({ ...set, name: 'Travel to China' }))
    expect(renamed[0]).toMatchObject({ name: 'Travel to China', updatedAt: later.toISOString() })
    expect(renamed[1]).toBe(exam)
  })

  it('deletes a set', () => {
    const sets = [createCustomSet({ name: 'A', description: '' }, 'custom-a', now)]
    expect(deleteCustomSet(sets, 'custom-a')).toEqual([])
  })

  it('adds items by id, without duplicates, and removes them', () => {
    let set = createCustomSet({ name: 'My Chinese', description: '' }, 'custom-a', now)
    set = addItem(set, 'word:苹果')
    set = addItem(set, 'word:机场')
    expect(addItem(set, 'word:苹果')).toBe(set)
    expect(set.itemIds).toEqual(['word:苹果', 'word:机场'])

    expect(removeItem(set, 'word:苹果').itemIds).toEqual(['word:机场'])
  })

  it('converts to a custom StudySet, with items from the whole dictionary', () => {
    const set = {
      ...createCustomSet({ name: 'Mine', description: '' }, 'custom-a', now),
      itemIds: ['word:苹果' as const, 'word:苹果[Píng guǒ]' as const],
    }

    expect(toStudySet(set)).toEqual({
      id: 'custom-a',
      type: 'custom',
      name: 'Mine',
      description: '',
      itemIds: ['word:苹果', 'word:苹果[Píng guǒ]'],
    })
  })
})

describe('custom meanings', () => {
  const base = addItem(addItem(createCustomSet({ name: 'Travel', description: '' }, 'custom-a', now), 'word:机场'), 'word:苹果')

  it('are added, edited and deleted per set item', () => {
    let set = setMeaning(base, 'word:机场', 'airport when travelling')
    expect(set.meanings).toEqual({ 'word:机场': 'airport when travelling' })

    set = setMeaning(set, 'word:机场', 'the airport')
    expect(set.meanings['word:机场']).toBe('the airport')

    expect(deleteMeaning(set, 'word:机场').meanings).toEqual({})
  })

  it('cannot be set on an item that is not in the set', () => {
    expect(setMeaning(base, 'word:学习', 'to study')).toBe(base)
  })

  it('removing the item from the set deletes its custom meaning', () => {
    const set = setMeaning(base, 'word:机场', 'airport')
    expect(removeItem(set, 'word:机场').meanings).toEqual({})
  })

  it('each set has its own: the same item in another set is not affected', () => {
    const other = addItem(createCustomSet({ name: 'Exam', description: '' }, 'custom-b', now), 'word:机场')
    const sets = updateCustomSet([base, other], 'custom-a', now, (set) => setMeaning(set, 'word:机场', 'airport'))

    expect(sets[0]?.meanings['word:机场']).toBe('airport')
    expect(sets[1]?.meanings).toEqual({})
  })

  it('rejects an empty meaning', () => {
    expect(validateMeaning('   ')).toEqual({ problem: 'emptyMeaning' })
    expect(validateMeaning(' apple ')).toEqual({ meaning: 'apple' })
  })
})

describe('saving custom sets', () => {
  it('saves and loads the sets as they are', () => {
    const storage = memoryStorage()
    const sets = [setMeaning(addItem(createCustomSet({ name: 'Mine', description: 'd' }, 'custom-a', now), 'word:苹果'), 'word:苹果', 'my apple')]
    saveCustomSets(sets, storage)

    expect(loadCustomSets(storage)).toEqual(sets)
  })

  it('discards malformed data without breaking the rest', () => {
    const storage = memoryStorage()
    storage.setItem(
      'hanzivocab.customSets',
      JSON.stringify({
        version: 1,
        sets: [
          { id: 'custom-a', name: 'Good', createdAt: 'x', updatedAt: 'x', itemIds: ['word:苹果', 'word:苹果', 42, 'bad'] },
          { id: 'custom-a', name: 'Duplicate id', createdAt: 'x', updatedAt: 'x' },
          { id: 'hsk-1', name: 'Not custom', createdAt: 'x', updatedAt: 'x' },
          { id: 'custom-b', name: '', createdAt: 'x', updatedAt: 'x' },
          'nonsense',
        ],
      }),
    )

    expect(loadCustomSets(storage)).toEqual([
      { id: 'custom-a', name: 'Good', description: '', itemIds: ['word:苹果'], meanings: {}, sentences: [], createdAt: 'x', updatedAt: 'x' },
    ])
  })
})
