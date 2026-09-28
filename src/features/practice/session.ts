import { getStudyItemId, type StudyItem } from '../dictionary/studyItem.ts'
import { sample, type RandomFn } from '../../lib/random.ts'
import { EXERCISE_DEFINITIONS, type ExerciseDefinition } from './exerciseDefinitions.ts'
import type { Exercise, ExerciseResult } from './types.ts'

export const DEFAULT_SESSION_SIZE = 10

interface CreateSessionOptions {
  size?: number
  random?: RandomFn
  definitions?: readonly ExerciseDefinition[]
}

/**
 * Crea los ejercicios de una sesión: elige elementos al azar y, para cada
 * uno, un tipo de ejercicio al azar entre los que se pueden construir.
 *
 * De momento elige al azar; cuando exista la repetición espaciada (fase 8)
 * se priorizarán los elementos pendientes de repaso.
 */
export function createSessionExercises(
  pool: readonly StudyItem[],
  { size = DEFAULT_SESSION_SIZE, random = Math.random, definitions = EXERCISE_DEFINITIONS }: CreateSessionOptions = {},
): Exercise[] {
  const exercises: Exercise[] = []
  for (const item of sample(pool, size, random)) {
    const candidates = definitions.filter((definition) => definition.canBuild(item, pool))
    const definition = candidates[Math.floor(random() * candidates.length)]
    if (definition) exercises.push(definition.build(item, pool, random))
  }
  return exercises
}

// --- Estado de una sesión en curso ------------------------------------------

export interface SessionState {
  exercises: readonly Exercise[]
  currentIndex: number
  results: readonly ExerciseResult[]
}

export type SessionAction = { type: 'answer'; correct: boolean }

export function createSessionState(exercises: readonly Exercise[]): SessionState {
  return { exercises, currentIndex: 0, results: [] }
}

/**
 * Reducer de la sesión: recibe el estado y una acción y devuelve el estado
 * nuevo, sin modificar el anterior. Es una función pura, así que se puede
 * probar sin React; el componente la usa con useReducer.
 */
export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  const exercise = getCurrentExercise(state)
  if (!exercise) return state

  switch (action.type) {
    case 'answer': {
      const result: ExerciseResult = {
        itemId: getStudyItemId(exercise.item),
        exerciseType: exercise.type,
        correct: action.correct,
      }
      return { ...state, currentIndex: state.currentIndex + 1, results: [...state.results, result] }
    }
  }
}

export function getCurrentExercise(state: SessionState): Exercise | undefined {
  return state.exercises[state.currentIndex]
}

export function isSessionFinished(state: SessionState): boolean {
  return state.currentIndex >= state.exercises.length
}

export interface SessionSummary {
  total: number
  correct: number
  wrong: number
}

export function summarizeResults(results: readonly ExerciseResult[]): SessionSummary {
  const correct = results.filter((result) => result.correct).length
  return { total: results.length, correct, wrong: results.length - correct }
}
