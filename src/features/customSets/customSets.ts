import type { StudyItemId } from '../dictionary/studyItem.ts'
import type { StudySet } from '../studySets/types.ts'
import type { CustomSet, CustomSetDetails } from './types.ts'

/**
 * Operations on the user's sets. They are pure functions: they take the
 * list and return a new one, without modifying the previous one. The Provider
 * uses them with useState and the tests exercise them without React.
 */

export const MAX_NAME_LENGTH = 60
export const MAX_DESCRIPTION_LENGTH = 200
export const MAX_MEANING_LENGTH = 200

export type DetailsProblem = 'emptyName' | 'nameTooLong' | 'descriptionTooLong'

/** Name and description, already cleaned up, or the problem with them. */
export function validateDetails(details: CustomSetDetails): { details: CustomSetDetails } | { problem: DetailsProblem } {
  const name = details.name.trim()
  const description = details.description.trim()
  if (name === '') return { problem: 'emptyName' }
  if (name.length > MAX_NAME_LENGTH) return { problem: 'nameTooLong' }
  if (description.length > MAX_DESCRIPTION_LENGTH) return { problem: 'descriptionTooLong' }
  return { details: { name, description } }
}

/** A unique id: "custom-" + UUID. */
export function createCustomSetId(): string {
  return `custom-${crypto.randomUUID()}`
}

export function createCustomSet(
  details: CustomSetDetails,
  id: string,
  now: Date,
  itemIds: readonly StudyItemId[] = [],
): CustomSet {
  const date = now.toISOString()
  return { id, ...details, itemIds: [...new Set(itemIds)], meanings: {}, sentences: [], createdAt: date, updatedAt: date }
}

/** Applies `change` to the set with that id and updates its date. The others do not change. */
export function updateCustomSet(
  sets: readonly CustomSet[],
  id: string,
  now: Date,
  change: (set: CustomSet) => CustomSet,
): CustomSet[] {
  return sets.map((set) => (set.id === id ? { ...change(set), updatedAt: now.toISOString() } : set))
}

export function deleteCustomSet(sets: readonly CustomSet[], id: string): CustomSet[] {
  return sets.filter((set) => set.id !== id)
}

/** Adds an item at the end. If it was already there, the set does not change (no duplicates). */
export function addItem(set: CustomSet, itemId: StudyItemId): CustomSet {
  return set.itemIds.includes(itemId) ? set : { ...set, itemIds: [...set.itemIds, itemId] }
}

/**
 * Removes an item from the set, along with its notes in this set. The item
 * stays in the dictionary and its progress is left untouched.
 */
export function removeItem(set: CustomSet, itemId: StudyItemId): CustomSet {
  return {
    ...deleteMeaning(set, itemId),
    itemIds: set.itemIds.filter((id) => id !== itemId),
    sentences: set.sentences.filter((sentence) => sentence.itemId !== itemId),
  }
}

export type MeaningProblem = 'emptyMeaning' | 'meaningTooLong'

/** The custom meaning, already cleaned up, or the problem with it. */
export function validateMeaning(meaning: string): { meaning: string } | { problem: MeaningProblem } {
  const trimmed = meaning.trim()
  if (trimmed === '') return { problem: 'emptyMeaning' }
  if (trimmed.length > MAX_MEANING_LENGTH) return { problem: 'meaningTooLong' }
  return { meaning: trimmed }
}

/** Saves the custom meaning of a set item (already validated). */
export function setMeaning(set: CustomSet, itemId: StudyItemId, meaning: string): CustomSet {
  if (!set.itemIds.includes(itemId)) return set
  return { ...set, meanings: { ...set.meanings, [itemId]: meaning } }
}

export function deleteMeaning(set: CustomSet, itemId: StudyItemId): CustomSet {
  if (set.meanings[itemId] === undefined) return set
  const meanings = { ...set.meanings }
  delete meanings[itemId]
  return { ...set, meanings }
}

/**
 * The StudySet used by the rest of the app (cards, progress, Learn, Study).
 * It keeps all the ids: non-HSK entries are loaded when the set is opened,
 * and getSetItems ignores an id that no longer exists in the dictionary.
 */
export function toStudySet(set: CustomSet): StudySet {
  return {
    id: set.id,
    type: 'custom',
    name: set.name,
    description: set.description,
    itemIds: set.itemIds,
  }
}
