import type { StudyItem, StudyItemId } from '../dictionary/studyItem.ts'

/** Flashcard: se muestra el hanzi y el usuario dice si lo sabía. */
export interface FlashcardExercise {
  type: 'flashcard'
  item: StudyItem
}

/**
 * Tipos de ejercicio de opción múltiple:
 * - `meaning-choice`: se muestra el hanzi y se elige su significado.
 * - `pinyin-choice`: se muestra el hanzi y se elige su pinyin.
 * - `hanzi-choice`: se muestra el significado y se elige el hanzi.
 */
export type ChoiceExerciseType = 'meaning-choice' | 'pinyin-choice' | 'hanzi-choice'

/** Opción múltiple: una de las opciones es `item` y las demás son distractores. */
export interface ChoiceExercise {
  type: ChoiceExerciseType
  item: StudyItem
  /** Opciones en el orden en que se muestran. */
  options: readonly StudyItem[]
}

/**
 * Todos los tipos de ejercicio. Es una unión discriminada por `type`:
 * para añadir un ejercicio nuevo se añade aquí su interfaz.
 */
export type Exercise = FlashcardExercise | ChoiceExercise

export type ExerciseType = Exercise['type']

/** Resultado de responder un ejercicio. Con él se actualiza el progreso. */
export interface ExerciseResult {
  itemId: StudyItemId
  exerciseType: ExerciseType
  correct: boolean
}
