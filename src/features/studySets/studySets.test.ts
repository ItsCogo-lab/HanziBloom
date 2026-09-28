import { describe, expect, it } from 'vitest'
import { allCharacters, allWords } from '../../data/index.ts'
import { topicDefinitions } from '../../data/topics.ts'
import { createDictionary } from '../dictionary/dictionary.ts'
import { hskDictionary } from '../dictionary/hskDictionary.ts'
import { testCharacters, testWords } from '../dictionary/testData.ts'
import { appStudySets } from './appStudySets.ts'
import {
  countSetItems,
  createHskSet,
  createStudySets,
  getSetItems,
  getSetsWithItem,
  getStudySet,
  listSetsOfType,
  validateStudySets,
} from './studySets.ts'
import type { StudySet } from './types.ts'

describe('sets de la app', () => {
  it('son coherentes: ids únicos y todos sus elementos existen en el dataset', () => {
    expect(validateStudySets(appStudySets, hskDictionary)).toEqual([])
  })

  it('hay un set por nivel HSK del 1 al 4', () => {
    expect(listSetsOfType(appStudySets, 'hsk').map((set) => [set.id, set.name, set.level])).toEqual([
      ['hsk-1', 'HSK 1', 1],
      ['hsk-2', 'HSK 2', 2],
      ['hsk-3', 'HSK 3', 3],
      ['hsk-4', 'HSK 4', 4],
    ])
  })

  /*
   * Los números salen del dataset (docs/DATA_SOURCES.md explica por qué no
   * son exactamente 150/150/300/600). Caracteres: los nuevos de cada nivel.
   */
  it.each([
    ['hsk-1', 150, 178],
    ['hsk-2', 149, 166],
    ['hsk-3', 299, 272],
    ['hsk-4', 598, 454],
  ])('%s tiene %i palabras y %i caracteres', (setId, words, characters) => {
    expect(countSetItems(getStudySet(appStudySets, setId)!)).toEqual({ words, characters })
  })

  it('los sets HSK contienen exactamente las palabras y caracteres de su nivel', () => {
    for (const level of [1, 2, 3, 4] as const) {
      const set = getStudySet(appStudySets, `hsk-${level}`)!
      const expected = [
        ...allWords.filter((word) => word.hskLevel === level).map((word) => `word:${word.id}`),
        ...allCharacters.filter((character) => character.hskLevel === level).map((character) => `char:${character.id}`),
      ]
      expect(set.itemIds).toEqual(expected)
    }
  })

  it('entre todos los sets HSK cubren el dataset entero, sin repetir', () => {
    const ids = listSetsOfType(appStudySets, 'hsk').flatMap((set) => set.itemIds)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toHaveLength(allWords.length + allCharacters.length)
  })

  it('hay un set por cada tema curado, con sus palabras', () => {
    const topics = listSetsOfType(appStudySets, 'topic')
    expect(topics.map((set) => set.id)).toEqual(topicDefinitions.map((topic) => `topic-${topic.id}`))
    expect(getStudySet(appStudySets, 'topic-food')).toMatchObject({ name: 'Food & drink', type: 'topic' })
    expect(topics.every((set) => set.itemIds.every((id) => id.startsWith('word:')))).toBe(true)
    expect(topics.map((set) => set.name)).toEqual(
      expect.arrayContaining(['Family', 'Travel', 'Numbers', 'Weather', 'Emotions', 'Transportation']),
    )
  })
})

describe('un elemento en varios sets', () => {
  it('苹果 está en HSK 1 y en «Food & drink», sin copiar la palabra', () => {
    const sets = getSetsWithItem(appStudySets, 'word:苹果').map((set) => set.id)
    expect(sets).toEqual(['hsk-1', 'topic-food'])

    const [fromHsk] = getSetItems(getStudySet(appStudySets, 'hsk-1')!, hskDictionary).filter(
      (item) => item.entry.id === '苹果',
    )
    const [fromTopic] = getSetItems(getStudySet(appStudySets, 'topic-food')!, hskDictionary).filter(
      (item) => item.entry.id === '苹果',
    )
    // Es el mismo objeto del diccionario: los sets solo guardan ids
    expect(fromHsk!.entry).toBe(fromTopic!.entry)
  })

  it('鱼 está en tres sets', () => {
    expect(getSetsWithItem(appStudySets, 'word:鱼').map((set) => set.id)).toEqual([
      'hsk-2',
      'topic-food',
      'topic-animals',
    ])
  })
})

describe('modelo StudySet', () => {
  const dictionary = createDictionary(testCharacters, testWords)

  it('crea un set HSK a partir del diccionario', () => {
    const set = createHskSet(dictionary, 1)
    expect(set).toMatchObject({ id: 'hsk-1', type: 'hsk', level: 1, name: 'HSK 1' })
    expect(set.itemIds).toEqual(['word:你好', 'word:好', 'word:谢谢', 'char:你', 'char:好', 'char:谢', 'char:了'])
  })

  it('admite sets propios (CUSTOM) sin cambiar nada', () => {
    const custom: StudySet = {
      id: 'custom-forgotten',
      type: 'custom',
      name: 'Words I keep forgetting',
      description: 'My own list',
      itemIds: ['word:谢谢', 'char:了'],
    }
    const sets = createStudySets(dictionary, [], [custom])

    expect(getStudySet(sets, 'custom-forgotten')).toBe(custom)
    expect(getSetItems(custom, dictionary).map((item) => item.entry.hanzi)).toEqual(['谢谢', '了'])
    expect(validateStudySets([custom], dictionary)).toEqual([])
  })

  it('la validación encuentra elementos que no existen, repetidos e ids duplicados', () => {
    const broken: StudySet = {
      id: 'hsk-1',
      type: 'topic',
      name: 'Broken',
      description: 'x',
      itemIds: ['word:不存在', 'word:谢谢', 'word:谢谢'],
    }
    expect(validateStudySets([createHskSet(dictionary, 1), broken], dictionary)).toEqual([
      'Set "hsk-1": id duplicado',
      'Set "hsk-1": "word:不存在" no está en el dataset',
      'Set "hsk-1": "word:谢谢" está repetido',
    ])
  })

  it('getSetItems ignora ids que ya no existen en el diccionario', () => {
    const set: StudySet = { id: 'x', type: 'custom', name: 'x', description: 'x', itemIds: ['word:谢谢', 'word:不存在'] }
    expect(getSetItems(set, dictionary)).toHaveLength(1)
  })
})
