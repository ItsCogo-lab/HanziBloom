import { getStudyItemId, type StudyItem } from '../dictionary/studyItem.ts'
import { createEmptyProgress, isDue } from '../progress/progress.ts'
import type { ProgressData } from '../progress/types.ts'
import { shuffle, type RandomFn } from '../../lib/random.ts'
import { EXERCISE_DEFINITIONS, type ExerciseDefinition } from './exerciseDefinitions.ts'
import type { Exercise, ExerciseResult } from './types.ts'

export const DEFAULT_SESSION_SIZE = 10

interface CreateSessionOptions {
  size?: number
  random?: RandomFn
  definitions?: readonly ExerciseDefinition[]
  /** Progreso del usuario: decide qué elementos entran en la sesión. */
  progress?: ProgressData
  now?: Date
}

/**
 * Crea los ejercicios de una sesión: elige los elementos según el progreso
 * (ver selectSessionItems) y, para cada uno, un tipo de ejercicio al azar
 * entre los que se pueden construir.
 */
export function createSessionExercises(
  pool: readonly StudyItem[],
  {
    size = DEFAULT_SESSION_SIZE,
    random = Math.random,
    definitions = EXERCISE_DEFINITIONS,
    progress = createEmptyProgress(),
    now = new Date(),
  }: CreateSessionOptions = {},
): Exercise[] {
  const exercises: Exercise[] = []
  for (const item of selectSessionItems(pool, progress, now, size, random)) {
    const candidates = definitions.filter((definition) => definition.canBuild(item, pool))
    const definition = candidates[Math.floor(random() * candidates.length)]
    if (definition) exercises.push(definition.build(item, pool, random))
  }
  return exercises
}

/**
 * Elige los elementos de una sesión, por orden de prioridad:
 *
 * 1. Repasos pendientes, empezando por los que llevan más tiempo esperando.
 * 2. Elementos nuevos, al azar.
 * 3. Si aún faltan, elementos ya estudiados cuyo repaso está más cerca.
 *
 * Al final se barajan para que no salgan agrupados por tipo.
 */
export function selectSessionItems(
  pool: readonly StudyItem[],
  progress: ProgressData,
  now: Date,
  size: number,
  random: RandomFn,
): StudyItem[] {
  const progressOf = (item: StudyItem) => progress.items[getStudyItemId(item)]
  // Las fechas ISO en UTC se ordenan bien como texto
  const byNextReview = (a: StudyItem, b: StudyItem) =>
    (progressOf(a)?.nextReviewAt ?? '').localeCompare(progressOf(b)?.nextReviewAt ?? '')

  const shuffled = shuffle(pool, random)
  const due = shuffled.filter((item) => isDue(progressOf(item), now)).sort(byNextReview)
  const fresh = shuffled.filter((item) => progressOf(item) === undefined)
  const upcoming = shuffled
    .filter((item) => progressOf(item) !== undefined && !isDue(progressOf(item), now))
    .sort(byNextReview)

  return shuffle([...due, ...fresh, ...upcoming].slice(0, size), random)
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
      const result = createExerciseResult(exercise, action.correct)
      return { ...state, currentIndex: state.currentIndex + 1, results: [...state.results, result] }
    }
  }
}

export function createExerciseResult(exercise: Exercise, correct: boolean): ExerciseResult {
  return { itemId: getStudyItemId(exercise.item), exerciseType: exercise.type, correct }
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
