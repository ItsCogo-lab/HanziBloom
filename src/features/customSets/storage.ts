import { isRecord, readJson, writeJson, type KeyValueStorage } from '../../lib/storage.ts'
import type { StudyItemId } from '../dictionary/studyItem.ts'
import { TONES } from '../../lib/tones.ts'
import type { CustomSentence, CustomSet, SentenceToken } from './types.ts'

export const CUSTOM_SETS_STORAGE_KEY = 'hanzivocab.customSets'
/** Version of the saved format, same as in progress/storage.ts. */
const CURRENT_VERSION = 1

export function saveCustomSets(sets: readonly CustomSet[], storage?: KeyValueStorage): boolean {
  return writeJson(CUSTOM_SETS_STORAGE_KEY, { version: CURRENT_VERSION, sets }, storage)
}

/**
 * Loads the user's sets. A set with an invalid format is discarded and,
 * within a set, anything without a valid shape is ignored: broken data must
 * not break the UI.
 */
export function loadCustomSets(storage?: KeyValueStorage): CustomSet[] {
  const saved = readJson(CUSTOM_SETS_STORAGE_KEY, storage)
  if (!isRecord(saved) || saved.version !== CURRENT_VERSION || !Array.isArray(saved.sets)) return []

  const sets: CustomSet[] = []
  for (const value of saved.sets) {
    const set = parseCustomSet(value)
    if (set && !sets.some((other) => other.id === set.id)) sets.push(set)
  }
  return sets
}

function parseCustomSet(value: unknown): CustomSet | undefined {
  if (!isRecord(value)) return undefined
  const { id, name, description, itemIds, meanings, sentences, createdAt, updatedAt } = value
  if (typeof id !== 'string' || !id.startsWith('custom-') || typeof name !== 'string' || name.trim() === '') {
    return undefined
  }
  if (typeof createdAt !== 'string' || typeof updatedAt !== 'string') return undefined
  const validItemIds = Array.isArray(itemIds) ? [...new Set(itemIds.filter(isStudyItemId))] : []
  return {
    id,
    name,
    description: typeof description === 'string' ? description : '',
    itemIds: validItemIds,
    meanings: parseMeanings(meanings, validItemIds),
    sentences: parseSentences(sentences, validItemIds),
    createdAt,
    updatedAt,
  }
}

/** Only non-empty text meanings for items that are in the set. */
function parseMeanings(value: unknown, itemIds: readonly StudyItemId[]): CustomSet['meanings'] {
  const meanings: CustomSet['meanings'] = {}
  if (!isRecord(value)) return meanings
  for (const [itemId, meaning] of Object.entries(value)) {
    if (isStudyItemId(itemId) && itemIds.includes(itemId) && typeof meaning === 'string' && meaning.trim() !== '') {
      meanings[itemId] = meaning
    }
  }
  return meanings
}

export function isStudyItemId(value: unknown): value is StudyItemId {
  return typeof value === 'string' && (value.startsWith('char:') || value.startsWith('word:')) && value.length > 5
}

/** Sentences with a valid shape, a unique id and tokens that form exactly the sentence. */
function parseSentences(value: unknown, itemIds: readonly StudyItemId[]): CustomSentence[] {
  if (!Array.isArray(value)) return []
  const sentences: CustomSentence[] = []
  for (const sentence of value) {
    if (!isRecord(sentence)) continue
    const { id, itemId, chinese, tokens, createdAt, updatedAt } = sentence
    if (typeof id !== 'string' || sentences.some((other) => other.id === id)) continue
    if (typeof chinese !== 'string' || typeof createdAt !== 'string' || typeof updatedAt !== 'string') continue
    if (itemId !== undefined && !(isStudyItemId(itemId) && itemIds.includes(itemId))) continue
    if (!Array.isArray(tokens) || !tokens.every(isSentenceToken)) continue
    if (tokens.map((token) => token.text).join('') !== chinese) continue
    sentences.push({ id, ...(itemId === undefined ? {} : { itemId }), chinese, tokens, createdAt, updatedAt })
  }
  return sentences
}

function isSentenceToken(value: unknown): value is SentenceToken {
  if (!isRecord(value) || typeof value.text !== 'string' || value.text === '') return false
  const { pinyin, tone, uncertain, candidates } = value
  return (
    (pinyin === undefined || typeof pinyin === 'string') &&
    (tone === undefined || TONES.includes(tone as never)) &&
    (uncertain === undefined || typeof uncertain === 'boolean') &&
    (candidates === undefined || (Array.isArray(candidates) && candidates.every((c) => typeof c === 'string')))
  )
}
