import type { TopicDefinition } from '../../data/topics.ts'
import { t, type MessageKey } from '../../i18n/index.ts'
import { listCharacters, listWords, type Dictionary } from '../dictionary/dictionary.ts'
import { getStudyItem, type StudyItem, type StudyItemId } from '../dictionary/studyItem.ts'
import type { HskLevel } from '../dictionary/types.ts'
import type { StudySet, StudySetType } from './types.ts'

export const HSK_LEVELS: readonly HskLevel[] = [1, 2, 3, 4]

const HSK_DESCRIPTIONS: Record<HskLevel, MessageKey> = {
  1: 'sets.hsk.description1',
  2: 'sets.hsk.description2',
  3: 'sets.hsk.description3',
  4: 'sets.hsk.description4',
}

const HSK_ICONS: Record<HskLevel, string> = { 1: '一', 2: '二', 3: '三', 4: '四' }

/**
 * Set for an HSK level: its words and the characters studied for the first
 * time at that level. It is computed from the dataset, never written by hand.
 */
export function createHskSet(dictionary: Dictionary, level: HskLevel): StudySet {
  return {
    id: `hsk-${level}`,
    type: 'hsk',
    level,
    name: t('sets.hsk.name', { level }),
    description: t(HSK_DESCRIPTIONS[level]),
    icon: HSK_ICONS[level],
    itemIds: [
      ...listWords(dictionary, level).map((word): StudyItemId => `word:${word.id}`),
      ...listCharacters(dictionary, level).map((character): StudyItemId => `char:${character.id}`),
    ],
  }
}

/** Set for a curated topic (src/data/topics.ts). It only contains words. */
export function createTopicSet(topic: TopicDefinition): StudySet {
  return {
    id: `topic-${topic.id}`,
    type: 'topic',
    name: topic.name,
    description: topic.description,
    icon: topic.icon,
    itemIds: topic.words.map((wordId): StudyItemId => `word:${wordId}`),
  }
}

/**
 * The app's sets: the HSK ones, the topic ones and, if passed, other sets.
 * The user's own are added in the UI with useStudySets().
 */
export function createStudySets(
  dictionary: Dictionary,
  topics: readonly TopicDefinition[],
  customSets: readonly StudySet[] = [],
): StudySet[] {
  return [...HSK_LEVELS.map((level) => createHskSet(dictionary, level)), ...topics.map(createTopicSet), ...customSets]
}

export function getStudySet(sets: readonly StudySet[], id: string): StudySet | undefined {
  return sets.find((set) => set.id === id)
}

export function listSetsOfType(sets: readonly StudySet[], type: StudySetType): StudySet[] {
  return sets.filter((set) => set.type === type)
}

/** The items of a set, taken from the dictionary (the set only stores ids). */
export function getSetItems(set: StudySet, dictionary: Dictionary): StudyItem[] {
  return set.itemIds.map((id) => getStudyItem(dictionary, id)).filter((item) => item !== undefined)
}

/** How many words and characters a set has, for the cards. */
export function countSetItems(set: StudySet): { words: number; characters: number } {
  const words = set.itemIds.filter((id) => id.startsWith('word:')).length
  return { words, characters: set.itemIds.length - words }
}

/** Sets that contain an item. An item can be in several. */
export function getSetsWithItem(sets: readonly StudySet[], itemId: StudyItemId): StudySet[] {
  return sets.filter((set) => set.itemIds.includes(itemId))
}

/**
 * Checks that the sets are consistent: unique ids, items that exist in the
 * dictionary and no repeats within a set. The tests use it so that an error
 * in the curated topics makes CI fail.
 */
export function validateStudySets(sets: readonly StudySet[], dictionary: Dictionary): string[] {
  const problems: string[] = []
  const setIds = new Set<string>()
  for (const set of sets) {
    if (setIds.has(set.id)) problems.push(`Set "${set.id}": duplicate id`)
    setIds.add(set.id)
    if (set.name.trim() === '' || set.description.trim() === '') problems.push(`Set "${set.id}": missing name or description`)
    if (set.itemIds.length === 0) problems.push(`Set "${set.id}": is empty`)
    if ((set.type === 'hsk') !== (set.level !== undefined)) problems.push(`Set "${set.id}": only HSK sets have a level`)

    const seen = new Set<StudyItemId>()
    for (const itemId of set.itemIds) {
      if (seen.has(itemId)) problems.push(`Set "${set.id}": "${itemId}" is repeated`)
      seen.add(itemId)
      if (!getStudyItem(dictionary, itemId)) problems.push(`Set "${set.id}": "${itemId}" is not in the dataset`)
    }
  }
  return problems
}
