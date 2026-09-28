import type { StudyItemId } from '../dictionary/studyItem.ts'
import type { HskLevel } from '../dictionary/types.ts'

/**
 * De dónde sale un set:
 * - `hsk`: un nivel HSK, calculado a partir del dataset.
 * - `topic`: un tema (comida, familia...), de una lista curada a mano (src/data/topics.ts).
 * - `custom`: creado por el usuario (preparado en el modelo; aún no hay pantalla para crearlos).
 */
export type StudySetType = 'hsk' | 'topic' | 'custom'

/**
 * Un conjunto de elementos para estudiar. Todos los tipos de set comparten
 * este modelo, así que la interfaz, el progreso y las sesiones funcionan
 * igual con cualquiera.
 *
 * Un set no copia las palabras: guarda sus ids. La misma palabra puede estar
 * en varios sets (苹果 en HSK 1 y en «Food») y su progreso es uno solo.
 */
export interface StudySet {
  /** Único entre todos los sets: "hsk-1", "topic-food", "custom-..." */
  id: string
  type: StudySetType
  name: string
  description: string
  /** Solo en los sets HSK. */
  level?: HskLevel
  /** Un carácter decorativo que hace de icono (no lo leen los lectores de pantalla). */
  icon?: string
  /** Caracteres y palabras del set, en su orden de estudio. */
  itemIds: readonly StudyItemId[]
}
