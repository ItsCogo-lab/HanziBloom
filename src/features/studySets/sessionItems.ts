import type { Dictionary } from '../dictionary/dictionary.ts'
import { getStudyItemId, type StudyItem } from '../dictionary/studyItem.ts'
import { isDue, isLearned } from '../progress/progress.ts'
import type { ProgressData } from '../progress/types.ts'
import { getSetItems } from './studySets.ts'
import type { StudySet } from './types.ts'

/**
 * Qué entra en cada tipo de sesión de un set. Toda la app filtra con estas
 * funciones, así Learn y Study nunca se mezclan:
 *
 * - Learn: elementos del set sin aprender (sin registro en el SRS).
 * - Study: solo elementos ya aprendidos (ver isLearned). Nunca uno nuevo.
 */
export type SetSessionType = 'learn' | 'study'

/** Elementos del set que aún no se han aprendido, en el orden del set. */
export function getLearnableItems(set: StudySet, dictionary: Dictionary, progress: ProgressData): StudyItem[] {
  return getSetItems(set, dictionary).filter((item) => !isLearned(progress, getStudyItemId(item)))
}

export interface ReviewItems {
  /** Aprendidos cuyo repaso toca ya, empezando por los que llevan más tiempo esperando. */
  due: StudyItem[]
  /** Aprendidos al día, empezando por los que tocan antes. */
  upToDate: StudyItem[]
}

/** Elementos del set ya aprendidos, separados en pendientes de repaso y al día. */
export function getReviewItems(set: StudySet, dictionary: Dictionary, progress: ProgressData, now: Date): ReviewItems {
  const nextReviewOf = (item: StudyItem) => progress.items[getStudyItemId(item)]?.nextReviewAt ?? ''
  // Las fechas ISO en UTC se ordenan bien como texto
  const learned = getSetItems(set, dictionary)
    .filter((item) => isLearned(progress, getStudyItemId(item)))
    .sort((a, b) => nextReviewOf(a).localeCompare(nextReviewOf(b)))
  return {
    due: learned.filter((item) => isDue(progress.items[getStudyItemId(item)], now)),
    upToDate: learned.filter((item) => !isDue(progress.items[getStudyItemId(item)], now)),
  }
}

export interface SetSessionCounts {
  /** Sin aprender: lo que puede introducir Learn. */
  learnable: number
  /** Aprendidos: lo único que puede repasar Study. */
  learned: number
  /** Aprendidos cuyo repaso toca ya. */
  due: number
}

/** Los números de las acciones Learn y Study, calculados con el progreso actual. */
export function getSetSessionCounts(set: StudySet, progress: ProgressData, now: Date): SetSessionCounts {
  const learnedIds = set.itemIds.filter((itemId) => isLearned(progress, itemId))
  return {
    learnable: set.itemIds.length - learnedIds.length,
    learned: learnedIds.length,
    due: learnedIds.filter((itemId) => isDue(progress.items[itemId], now)).length,
  }
}

