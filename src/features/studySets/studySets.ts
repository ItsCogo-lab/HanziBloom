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
 * Set de un nivel HSK: sus palabras y los caracteres que se estudian por
 * primera vez en ese nivel. Se calcula del dataset, nunca se escribe a mano.
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

/** Set de un tema curado (src/data/topics.ts). Solo contiene palabras. */
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
 * Todos los sets de la app: los HSK, los de temas y (cuando existan) los del
 * usuario. Los sets de usuario ya encajan en el modelo: solo hace falta
 * guardarlos y pasarlos aquí.
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

/** Los elementos de un set, sacados del diccionario (el set solo guarda ids). */
export function getSetItems(set: StudySet, dictionary: Dictionary): StudyItem[] {
  return set.itemIds.map((id) => getStudyItem(dictionary, id)).filter((item) => item !== undefined)
}

/** Cuántas palabras y caracteres tiene un set, para las tarjetas. */
export function countSetItems(set: StudySet): { words: number; characters: number } {
  const words = set.itemIds.filter((id) => id.startsWith('word:')).length
  return { words, characters: set.itemIds.length - words }
}

/** Sets que contienen un elemento. Un elemento puede estar en varios. */
export function getSetsWithItem(sets: readonly StudySet[], itemId: StudyItemId): StudySet[] {
  return sets.filter((set) => set.itemIds.includes(itemId))
}

/**
 * Comprueba que los sets son coherentes: ids únicos, elementos que existen
 * en el diccionario y sin repetir dentro de un set. Los tests lo usan para
 * que un error en los temas curados haga fallar la CI.
 */
export function validateStudySets(sets: readonly StudySet[], dictionary: Dictionary): string[] {
  const problems: string[] = []
  const setIds = new Set<string>()
  for (const set of sets) {
    if (setIds.has(set.id)) problems.push(`Set "${set.id}": id duplicado`)
    setIds.add(set.id)
    if (set.name.trim() === '' || set.description.trim() === '') problems.push(`Set "${set.id}": falta el nombre o la descripción`)
    if (set.itemIds.length === 0) problems.push(`Set "${set.id}": está vacío`)
    if ((set.type === 'hsk') !== (set.level !== undefined)) problems.push(`Set "${set.id}": solo los sets HSK tienen nivel`)

    const seen = new Set<StudyItemId>()
    for (const itemId of set.itemIds) {
      if (seen.has(itemId)) problems.push(`Set "${set.id}": "${itemId}" está repetido`)
      seen.add(itemId)
      if (!getStudyItem(dictionary, itemId)) problems.push(`Set "${set.id}": "${itemId}" no está en el dataset`)
    }
  }
  return problems
}
