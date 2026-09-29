import { addDays, startOfDay } from '../../lib/dates.ts'

/**
 * Repetición espaciada con cajas de Leitner.
 *
 * Cada elemento está en un nivel de dominio de 0 a 5. Al acertar sube un
 * nivel y al fallar vuelve a 0. Cada nivel fija cuántos días esperar hasta el
 * siguiente repaso: lo que ya sabes aparece cada vez menos y lo que fallas,
 * enseguida.
 *
 * El resto de la app solo usa `scheduleNextReview` e `isReviewDue`: cambiar
 * a otro algoritmo (SM-2, FSRS) no afectaría a nada más.
 */
export const REVIEW_INTERVAL_DAYS = [0, 1, 3, 7, 14, 30] as const

export const MAX_MASTERY_LEVEL = REVIEW_INTERVAL_DAYS.length - 1

export interface ReviewSchedule {
  masteryLevel: number
  /** Fecha (ISO 8601) a partir de la cual toca repasar. */
  nextReviewAt: string
}

/**
 * Nivel y fecha del siguiente repaso después de responder.
 *
 * Los repasos van por días: el repaso "de mañana" está disponible desde las
 * 00:00 de mañana, no 24 horas exactas después. El nivel 0 (0 días) queda
 * pendiente para hoy mismo.
 */
export function scheduleNextReview(masteryLevel: number, wasCorrect: boolean, now: Date): ReviewSchedule {
  const nextLevel = wasCorrect ? Math.min(masteryLevel + 1, MAX_MASTERY_LEVEL) : 0
  const interval = REVIEW_INTERVAL_DAYS[nextLevel] ?? 0
  return {
    masteryLevel: nextLevel,
    nextReviewAt: addDays(startOfDay(now), interval).toISOString(),
  }
}

/** Programación de un elemento recién aprendido: nivel 0, que toca repasar hoy. */
export function scheduleFirstReview(now: Date): ReviewSchedule {
  return { masteryLevel: 0, nextReviewAt: addDays(startOfDay(now), REVIEW_INTERVAL_DAYS[0]).toISOString() }
}

/**
 * Programación de un elemento que el usuario ya conocía al verlo en Learn:
 * empieza en el nivel máximo, así que vuelve a los 30 días. Si lo acierta
 * sigue cada 30 días; si lo falla, vuelve al nivel 0 como cualquier otro.
 */
export function scheduleKnownItem(now: Date): ReviewSchedule {
  return {
    masteryLevel: MAX_MASTERY_LEVEL,
    nextReviewAt: addDays(startOfDay(now), REVIEW_INTERVAL_DAYS[MAX_MASTERY_LEVEL] ?? 0).toISOString(),
  }
}

export function isReviewDue(nextReviewAt: string, now: Date): boolean {
  return Date.parse(nextReviewAt) <= now.getTime()
}
