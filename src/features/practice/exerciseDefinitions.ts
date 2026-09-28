import type { StudyItem } from '../dictionary/studyItem.ts'
import type { RandomFn } from '../../lib/random.ts'
import { hanziChoiceDefinition, meaningChoiceDefinition, pinyinChoiceDefinition } from './choiceExercises.ts'
import type { Exercise, FlashcardExercise } from './types.ts'

/**
 * Cómo se construye un tipo de ejercicio. Cada tipo sabe si puede crearse
 * para un elemento (p. ej. un ejercicio de opciones necesita suficientes
 * elementos para inventar respuestas incorrectas) y cómo crearlo.
 *
 * `pool` son todos los elementos disponibles y `random` se inyecta para que
 * los tests sean deterministas.
 */
export interface ExerciseDefinition<E extends Exercise = Exercise> {
  type: E['type']
  canBuild(item: StudyItem, pool: readonly StudyItem[]): boolean
  build(item: StudyItem, pool: readonly StudyItem[], random: RandomFn): E
}

export const flashcardDefinition: ExerciseDefinition<FlashcardExercise> = {
  type: 'flashcard',
  canBuild: () => true,
  build: (item) => ({ type: 'flashcard', item }),
}

/** Tipos de ejercicio disponibles. Añadir uno nuevo = añadir su definición aquí. */
export const EXERCISE_DEFINITIONS: readonly ExerciseDefinition[] = [
  flashcardDefinition,
  meaningChoiceDefinition,
  pinyinChoiceDefinition,
  hanziChoiceDefinition,
]
