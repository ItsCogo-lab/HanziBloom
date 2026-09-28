import type { StudyItemId } from '../dictionary/studyItem.ts'

/**
 * Un set creado por el usuario, tal como se guarda. Solo guarda ids de
 * elementos del diccionario: nunca copia ni cambia hanzi, pinyin ni
 * significados, que siguen saliendo del dataset. Es JSON puro, así que se
 * puede exportar o mandar a un servidor más adelante sin cambiarlo.
 */
export interface CustomSet {
  /** "custom-" + un id aleatorio; único entre todos los sets. */
  id: string
  name: string
  /** Opcional: puede estar vacía. */
  description: string
  itemIds: StudyItemId[]
  /**
   * Significados propios del usuario para elementos de este set. Son notas
   * suyas: el significado del diccionario no cambia, y el mismo elemento en
   * otro set tiene sus propias notas.
   */
  meanings: Partial<Record<StudyItemId, string>>
  /** Fechas ISO 8601. */
  createdAt: string
  updatedAt: string
}

export interface CustomSetDetails {
  name: string
  description: string
}
