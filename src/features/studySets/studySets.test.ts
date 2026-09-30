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

describe('app sets', () => {
  it('are consistent: unique ids and all their items exist in the dataset', () => {
    expect(validateStudySets(appStudySets, hskDictionary)).toEqual([])
  })

  it('there is one set per HSK level from 1 to 4', () => {
    expect(listSetsOfType(appStudySets, 'hsk').map((set) => [set.id, set.name, set.level])).toEqual([
      ['hsk-1', 'HSK 1', 1],
      ['hsk-2', 'HSK 2', 2],
      ['hsk-3', 'HSK 3', 3],
      ['hsk-4', 'HSK 4', 4],
    ])
  })

  /*
   * The numbers come from the dataset (docs/DATA_SOURCES.md explains why they
   * are not exactly 150/150/300/600). Only words: characters are learned
   * through them.
   */
  it.each([
    ['hsk-1', 150],
    ['hsk-2', 149],
    ['hsk-3', 299],
    ['hsk-4', 598],
  ])('%s has %i words and no characters', (setId, words) => {
    expect(countSetItems(getStudySet(appStudySets, setId)!)).toEqual({ words, characters: 0 })
  })

  it('HSK sets contain exactly the words of their level', () => {
    for (const level of [1, 2, 3, 4] as const) {
      const set = getStudySet(appStudySets, `hsk-${level}`)!
      const expected = allWords.filter((word) => word.hskLevel === level).map((word) => `word:${word.id}`)
      expect(set.itemIds).toEqual(expected)
    }
  })

  it('together the HSK sets cover every word, without repeats', () => {
    const ids = listSetsOfType(appStudySets, 'hsk').flatMap((set) => set.itemIds)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toHaveLength(allWords.length)
  })

  it('every HSK character appears in at least one HSK word, so it is still learned', () => {
    const hanzi = new Set(allWords.flatMap((word) => Array.from(word.hanzi)))
    expect(allCharacters.filter((character) => !hanzi.has(character.hanzi)).map((c) => c.hanzi)).toEqual([])
  })

  it('there is one set per curated topic, with its words', () => {
    const topics = listSetsOfType(appStudySets, 'topic')
    expect(topics.map((set) => set.id)).toEqual(topicDefinitions.map((topic) => `topic-${topic.id}`))
    expect(getStudySet(appStudySets, 'topic-food')).toMatchObject({ name: 'Food & drink', type: 'topic' })
    expect(topics.every((set) => set.itemIds.every((id) => id.startsWith('word:')))).toBe(true)
    expect(topics.map((set) => set.name)).toEqual(
      expect.arrayContaining(['Family', 'Travel', 'Numbers', 'Weather', 'Emotions', 'Transportation']),
    )
  })
})

describe('an item in several sets', () => {
  it('苹果 is in HSK 1 and in "Food & drink", without copying the word', () => {
    const sets = getSetsWithItem(appStudySets, 'word:苹果').map((set) => set.id)
    expect(sets).toEqual(['hsk-1', 'topic-food'])

    const [fromHsk] = getSetItems(getStudySet(appStudySets, 'hsk-1')!, hskDictionary).filter(
      (item) => item.entry.id === '苹果',
    )
    const [fromTopic] = getSetItems(getStudySet(appStudySets, 'topic-food')!, hskDictionary).filter(
      (item) => item.entry.id === '苹果',
    )
    // It is the same dictionary object: sets only store ids
    expect(fromHsk!.entry).toBe(fromTopic!.entry)
  })

  it('鱼 is in three sets', () => {
    expect(getSetsWithItem(appStudySets, 'word:鱼').map((set) => set.id)).toEqual([
      'hsk-2',
      'topic-food',
      'topic-animals',
    ])
  })
})

describe('StudySet model', () => {
  const dictionary = createDictionary(testCharacters, testWords)

  it('creates an HSK set from the dictionary', () => {
    const set = createHskSet(dictionary, 1)
    expect(set).toMatchObject({ id: 'hsk-1', type: 'hsk', level: 1, name: 'HSK 1' })
    expect(set.itemIds).toEqual(['word:你好', 'word:好', 'word:谢谢'])
  })

  it('supports custom sets (CUSTOM) without changing anything', () => {
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

  it('validation finds items that do not exist, repeats and duplicate ids', () => {
    const broken: StudySet = {
      id: 'hsk-1',
      type: 'topic',
      name: 'Broken',
      description: 'x',
      itemIds: ['word:不存在', 'word:谢谢', 'word:谢谢'],
    }
    expect(validateStudySets([createHskSet(dictionary, 1), broken], dictionary)).toEqual([
      'Set "hsk-1": duplicate id',
      'Set "hsk-1": "word:不存在" is not in the dataset',
      'Set "hsk-1": "word:谢谢" is repeated',
    ])
  })

  it('getSetItems ignores ids that no longer exist in the dictionary', () => {
    const set: StudySet = { id: 'x', type: 'custom', name: 'x', description: 'x', itemIds: ['word:谢谢', 'word:不存在'] }
    expect(getSetItems(set, dictionary)).toHaveLength(1)
  })
})
