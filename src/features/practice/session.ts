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
  /** The user's progress: decides which items go into the session. */
  progress?: ProgressData
  now?: Date
  /**
   * Where the wrong answers of choice questions come from. By default, the
   * same `pool`. When studying a small set (a 7-word topic) it is better to
   * take them from the whole dictionary.
   */
  distractorPool?: readonly StudyItem[]
}

/**
 * Creates the exercises of a session: picks the items based on progress
 * (see selectSessionItems) and, for each one, a random exercise type among
 * those that can be built.
 */
export function createSessionExercises(
  pool: readonly StudyItem[],
  {
    size = DEFAULT_SESSION_SIZE,
    random = Math.random,
    definitions = EXERCISE_DEFINITIONS,
    progress = createEmptyProgress(),
    now = new Date(),
    distractorPool = pool,
  }: CreateSessionOptions = {},
): Exercise[] {
  const exercises: Exercise[] = []
  for (const item of selectSessionItems(pool, progress, now, size, random)) {
    const candidates = definitions.filter((definition) => definition.canBuild(item, distractorPool))
    const definition = candidates[Math.floor(random() * candidates.length)]
    if (definition) exercises.push(definition.build(item, distractorPool, random))
  }
  return exercises
}

/**
 * Picks the items of a session, in order of priority:
 *
 * 1. Due reviews, starting with the ones that have been waiting longest.
 * 2. New items, at random.
 * 3. If still short, already studied items whose review is closest
 *    (basic ones last).
 *
 * At the end they are shuffled so they do not come out grouped by kind.
 */
export function selectSessionItems(
  pool: readonly StudyItem[],
  progress: ProgressData,
  now: Date,
  size: number,
  random: RandomFn,
): StudyItem[] {
  const progressOf = (item: StudyItem) => progress.items[getStudyItemId(item)]
  // ISO dates in UTC sort correctly as text
  const byNextReview = (a: StudyItem, b: StudyItem) =>
    (progressOf(a)?.nextReviewAt ?? '').localeCompare(progressOf(b)?.nextReviewAt ?? '')

  const shuffled = shuffle(pool, random)
  const due = shuffled.filter((item) => isDue(progressOf(item), now)).sort(byNextReview)
  const fresh = shuffled.filter((item) => progressOf(item) === undefined)
  // Basic items (see applyHskLevel) are never due: they go at the very end
  const isBasic = (item: StudyItem) => Number(progressOf(item)?.basic === true)
  const upcoming = shuffled
    .filter((item) => progressOf(item) !== undefined && !isDue(progressOf(item), now))
    .sort((a, b) => isBasic(a) - isBasic(b) || byNextReview(a, b))

  return shuffle([...due, ...fresh, ...upcoming].slice(0, size), random)
}

// --- State of an ongoing session -------------------------------------------

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
 * Session reducer: takes the state and an action and returns the new state,
 * without modifying the previous one. It is a pure function, so it can be
 * tested without React; the component uses it with useReducer.
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
