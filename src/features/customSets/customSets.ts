import type { StudyItemId } from '../dictionary/studyItem.ts'
import type { StudySet } from '../studySets/types.ts'
import type { CustomSet, CustomSetDetails } from './types.ts'

/**
 * Operaciones sobre los sets del usuario. Son funciones puras: reciben la
 * lista y devuelven una nueva, sin modificar la anterior. El Provider las usa
 * con useState y los tests las prueban sin React.
 */

export const MAX_NAME_LENGTH = 60
export const MAX_DESCRIPTION_LENGTH = 200

export type DetailsProblem = 'emptyName' | 'nameTooLong' | 'descriptionTooLong'

/** Nombre y descripción ya limpios, o el problema que tienen. */
export function validateDetails(details: CustomSetDetails): { details: CustomSetDetails } | { problem: DetailsProblem } {
  const name = details.name.trim()
  const description = details.description.trim()
  if (name === '') return { problem: 'emptyName' }
  if (name.length > MAX_NAME_LENGTH) return { problem: 'nameTooLong' }
  if (description.length > MAX_DESCRIPTION_LENGTH) return { problem: 'descriptionTooLong' }
  return { details: { name, description } }
}

/** Un id que no se repite: "custom-" + UUID. */
export function createCustomSetId(): string {
  return `custom-${crypto.randomUUID()}`
}

export function createCustomSet(details: CustomSetDetails, id: string, now: Date): CustomSet {
  const date = now.toISOString()
  return { id, ...details, itemIds: [], createdAt: date, updatedAt: date }
}

/** Aplica `change` al set con ese id y actualiza su fecha. Los demás no cambian. */
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

/** Añade un elemento al final. Si ya estaba, el set no cambia (no hay repetidos). */
export function addItem(set: CustomSet, itemId: StudyItemId): CustomSet {
  return set.itemIds.includes(itemId) ? set : { ...set, itemIds: [...set.itemIds, itemId] }
}

/** Quita un elemento del set. El elemento sigue en el diccionario y su progreso no se toca. */
export function removeItem(set: CustomSet, itemId: StudyItemId): CustomSet {
  return { ...set, itemIds: set.itemIds.filter((id) => id !== itemId) }
}

/**
 * El StudySet que usa el resto de la app (tarjetas, progreso, Learn, Study).
 * `exists` filtra ids que ya no estén en el dataset, para que un dato viejo
 * no rompa una sesión.
 */
export function toStudySet(set: CustomSet, exists: (itemId: StudyItemId) => boolean): StudySet {
  return {
    id: set.id,
    type: 'custom',
    name: set.name,
    description: set.description,
    itemIds: set.itemIds.filter(exists),
  }
}
