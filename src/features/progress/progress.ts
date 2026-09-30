import { toDateKey } from '../../lib/dates.ts'
import type { HskLevel } from '../dictionary/types.ts'
import type { StudyItemId } from '../dictionary/studyItem.ts'
import { isReviewDue, MAX_MASTERY_LEVEL, scheduleFirstReview, scheduleKnownItem, scheduleNextReview, type ReviewSchedule } from '../srs/srs.ts'
import type { ItemProgress, ProgressData } from './types.ts'

/**
 * Nivel a partir del cual un elemento se considera dominado: su siguiente
 * repaso está a 14 días o más.
 */
export const MASTERED_LEVEL = 4

export type ItemStatus = 'new' | 'learning' | 'mastered'

export function createEmptyProgress(): ProgressData {
  return { items: {}, activity: {} }
}

/**
 * Registra una respuesta: actualiza los contadores del elemento, programa su
 * siguiente repaso y suma la respuesta a la actividad del día. Devuelve un
 * objeto nuevo sin modificar el anterior (así React detecta el cambio).
 */
export function recordAnswer(progress: ProgressData, itemId: StudyItemId, correct: boolean, now: Date): ProgressData {
  const previous = progress.items[itemId]
  // Sin la marca `basic`: un elemento básico que se responde vuelve al SRS normal
  const item: ItemProgress = {
    itemId,
    timesSeen: (previous?.timesSeen ?? 0) + 1,
    timesCorrect: (previous?.timesCorrect ?? 0) + (correct ? 1 : 0),
    timesWrong: (previous?.timesWrong ?? 0) + (correct ? 0 : 1),
    lastReviewedAt: now.toISOString(),
    ...scheduleNextReview(previous?.masteryLevel ?? 0, correct, now),
  }

  const day = toDateKey(now)
  const today = progress.activity[day] ?? { answers: 0, correct: 0 }

  return {
    items: { ...progress.items, [itemId]: item },
    activity: {
      ...progress.activity,
      [day]: { answers: today.answers + 1, correct: today.correct + (correct ? 1 : 0) },
    },
  }
}

/**
 * Marca un elemento como aprendido en una sesión Learn: le crea su registro
 * en la repetición espaciada (nivel 0, primer repaso hoy). No cuenta como
 * respuesta, así que no cambia la actividad ni la racha. Si el elemento ya
 * tenía registro, no se toca.
 */
export function introduceItem(progress: ProgressData, itemId: StudyItemId, now: Date): ProgressData {
  return addItem(progress, itemId, now, scheduleFirstReview(now))
}

/**
 * Como introduceItem, pero para un elemento que el usuario ya domina: entra
 * directamente como dominado y su primer repaso llega dentro de mucho (ver
 * scheduleKnownItem). Sigue saliendo en Study, pero muy de vez en cuando.
 */
export function markItemKnown(progress: ProgressData, itemId: StudyItemId, now: Date): ProgressData {
  return addItem(progress, itemId, now, scheduleKnownItem(now))
}

/** Un elemento de HSK con su nivel, para aplicar el nivel del usuario. */
export interface LeveledItem {
  itemId: StudyItemId
  hskLevel: HskLevel
}

/**
 * Niveles por debajo del del usuario a partir de los cuales el vocabulario es
 * básico: con HSK 3, lo de HSK 1 ya no hace falta repasarlo.
 */
export const BASIC_LEVEL_GAP = 2

/** Días entre los que se reparten los primeros repasos al marcar un nivel entero. */
const LEVEL_SPREAD_DAYS = 30

/**
 * Aplica el nivel HSK que el usuario dice tener (`null` si no indica ninguno):
 *
 * - Hasta su nivel, lo que aún no tenía registro entra como dominado (ver
 *   markItemKnown), con los primeros repasos repartidos en 30 días más.
 * - Lo que está BASIC_LEVEL_GAP niveles o más por debajo es básico: dominado
 *   y sin repasos, aunque ya se estuviera estudiando.
 * - Lo que era básico y deja de serlo (bajó el nivel) vuelve a repasarse de
 *   vez en cuando como dominado.
 *
 * Lo demás no se toca. Como las demás funciones, devuelve un objeto nuevo.
 */
export function applyHskLevel(
  progress: ProgressData,
  items: readonly LeveledItem[],
  userLevel: HskLevel | null,
  now: Date,
): ProgressData {
  const updated = { ...progress.items }
  let scheduled = 0
  const knownSchedule = () => scheduleKnownItem(now, scheduled++ % LEVEL_SPREAD_DAYS)

  for (const { itemId, hskLevel } of items) {
    const existing = progress.items[itemId]
    const isBasic = userLevel !== null && hskLevel <= userLevel - BASIC_LEVEL_GAP
    const isKnown = userLevel !== null && hskLevel <= userLevel

    if (isBasic) {
      if (existing?.basic) continue
      updated[itemId] = { ...(existing ?? newItem(itemId, now)), masteryLevel: MAX_MASTERY_LEVEL, basic: true }
    } else if (existing?.basic) {
      const { basic: _basic, ...rest } = existing
      updated[itemId] = { ...rest, ...knownSchedule() }
    } else if (isKnown && !existing) {
      updated[itemId] = { ...newItem(itemId, now), ...knownSchedule() }
    }
  }
  return { ...progress, items: updated }
}

/** Registro sin respuestas; quien lo usa le pone su propia programación. */
function newItem(itemId: StudyItemId, now: Date): ItemProgress {
  return { itemId, timesSeen: 0, timesCorrect: 0, timesWrong: 0, lastReviewedAt: now.toISOString(), ...scheduleKnownItem(now) }
}

function addItem(progress: ProgressData, itemId: StudyItemId, now: Date, schedule: ReviewSchedule): ProgressData {
  if (progress.items[itemId]) return progress
  return { ...progress, items: { ...progress.items, [itemId]: { ...newItem(itemId, now), ...schedule } } }
}

/**
 * Un elemento está aprendido si ya tiene registro en la repetición espaciada:
 * se marcó en Learn o ya se respondió alguna vez. Es lo mismo que decir que
 * su estado no es 'new' (ver getItemStatus).
 */
export function isLearned(progress: ProgressData, itemId: StudyItemId): boolean {
  return progress.items[itemId] !== undefined
}

export function getItemStatus(item: ItemProgress | undefined): ItemStatus {
  if (!item) return 'new'
  return item.masteryLevel >= MASTERED_LEVEL ? 'mastered' : 'learning'
}

/** ¿Toca repasar este elemento? Los nuevos y los básicos no cuentan como repaso pendiente. */
export function isDue(item: ItemProgress | undefined, now: Date): boolean {
  return item !== undefined && !item.basic && isReviewDue(item.nextReviewAt, now)
}
