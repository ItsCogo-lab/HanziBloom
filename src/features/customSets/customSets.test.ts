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

describe('sets propios', () => {
  it('valida el nombre y limpia los espacios', () => {
    expect(validateDetails({ name: '  My Chinese ', description: ' ' })).toEqual({
      details: { name: 'My Chinese', description: '' },
    })
    expect(validateDetails({ name: '   ', description: '' })).toEqual({ problem: 'emptyName' })
    expect(validateDetails({ name: 'x'.repeat(61), description: '' })).toEqual({ problem: 'nameTooLong' })
  })

  it('crea un set vacío y lo renombra sin tocar los demás', () => {
    const travel = createCustomSet({ name: 'Travel', description: '' }, 'custom-a', now)
    const exam = createCustomSet({ name: 'Exam', description: 'HSK 3' }, 'custom-b', now)
    expect(travel).toMatchObject({ id: 'custom-a', name: 'Travel', itemIds: [] })

    const renamed = updateCustomSet([travel, exam], 'custom-a', later, (set) => ({ ...set, name: 'Travel to China' }))
    expect(renamed[0]).toMatchObject({ name: 'Travel to China', updatedAt: later.toISOString() })
    expect(renamed[1]).toBe(exam)
  })

  it('borra un set', () => {
    const sets = [createCustomSet({ name: 'A', description: '' }, 'custom-a', now)]
    expect(deleteCustomSet(sets, 'custom-a')).toEqual([])
  })

  it('añade elementos por id, sin repetidos, y los quita', () => {
    let set = createCustomSet({ name: 'My Chinese', description: '' }, 'custom-a', now)
    set = addItem(set, 'word:苹果')
    set = addItem(set, 'word:机场')
    expect(addItem(set, 'word:苹果')).toBe(set)
    expect(set.itemIds).toEqual(['word:苹果', 'word:机场'])

    expect(removeItem(set, 'word:苹果').itemIds).toEqual(['word:机场'])
  })

  it('se convierte en un StudySet de tipo custom, sin elementos que ya no existan', () => {
    const set = { ...createCustomSet({ name: 'Mine', description: '' }, 'custom-a', now), itemIds: ['word:苹果' as const, 'word:xyz' as const] }

    expect(toStudySet(set, (itemId) => itemId !== 'word:xyz')).toEqual({
      id: 'custom-a',
      type: 'custom',
      name: 'Mine',
      description: '',
      itemIds: ['word:苹果'],
    })
  })
})

describe('significados propios', () => {
  const base = addItem(addItem(createCustomSet({ name: 'Travel', description: '' }, 'custom-a', now), 'word:机场'), 'word:苹果')

  it('se añaden, se editan y se borran por elemento del set', () => {
    let set = setMeaning(base, 'word:机场', 'airport when travelling')
    expect(set.meanings).toEqual({ 'word:机场': 'airport when travelling' })

    set = setMeaning(set, 'word:机场', 'the airport')
    expect(set.meanings['word:机场']).toBe('the airport')

    expect(deleteMeaning(set, 'word:机场').meanings).toEqual({})
  })

  it('no se puede poner a un elemento que no está en el set', () => {
    expect(setMeaning(base, 'word:学习', 'to study')).toBe(base)
  })

  it('al quitar el elemento del set se borra su significado propio', () => {
    const set = setMeaning(base, 'word:机场', 'airport')
    expect(removeItem(set, 'word:机场').meanings).toEqual({})
  })

  it('cada set tiene los suyos: el mismo elemento en otro set no se ve afectado', () => {
    const other = addItem(createCustomSet({ name: 'Exam', description: '' }, 'custom-b', now), 'word:机场')
    const sets = updateCustomSet([base, other], 'custom-a', now, (set) => setMeaning(set, 'word:机场', 'airport'))

    expect(sets[0]?.meanings['word:机场']).toBe('airport')
    expect(sets[1]?.meanings).toEqual({})
  })

  it('no acepta un significado vacío', () => {
    expect(validateMeaning('   ')).toEqual({ problem: 'emptyMeaning' })
    expect(validateMeaning(' apple ')).toEqual({ meaning: 'apple' })
  })
})

describe('guardar sets propios', () => {
  it('guarda y carga los sets tal cual', () => {
    const storage = memoryStorage()
    const sets = [setMeaning(addItem(createCustomSet({ name: 'Mine', description: 'd' }, 'custom-a', now), 'word:苹果'), 'word:苹果', 'my apple')]
    saveCustomSets(sets, storage)

    expect(loadCustomSets(storage)).toEqual(sets)
  })

  it('descarta lo que tiene mal formato sin romper el resto', () => {
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
