import type { StudyItem, StudyItemId } from '../dictionary/studyItem.ts'

/** Flashcard: se muestra el hanzi y el usuario dice si lo sabía. */
export interface FlashcardExercise {
  type: 'flashcard'
  item: StudyItem
}

/**
 * Todos los tipos de ejercicio. Es una unión discriminada por `type`:
 * para añadir un ejercicio nuevo se añade aquí su interfaz.
 */
export type Exercise = FlashcardExercise

export type ExerciseType = Exercise['type']

/** Resultado de responder un ejercicio. Lo usará el sistema de progreso. */
export interface ExerciseResult {
  itemId: StudyItemId
  exerciseType: ExerciseType
  correct: boolean
}
