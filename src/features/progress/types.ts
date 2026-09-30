import type { DateKey } from '../../lib/dates.ts'
import type { StudyItemId } from '../dictionary/studyItem.ts'

/** Lo que se sabe de un carácter o palabra que el usuario ya ha estudiado. */
export interface ItemProgress {
  itemId: StudyItemId
  timesSeen: number
  timesCorrect: number
  timesWrong: number
  /** Nivel de dominio de la repetición espaciada (0-5). */
  masteryLevel: number
  /** Fechas en formato ISO 8601. */
  lastReviewedAt: string
  nextReviewAt: string
  /**
   * Vocabulario básico para el nivel HSK del usuario (ver applyHskLevel): no
   * toca repasarlo nunca. Si se responde mal en un repaso voluntario, pierde
   * la marca y vuelve a la repetición espaciada normal.
   */
  basic?: true
  /**
   * El registro lo creó applyHskLevel y aún no se ha respondido nunca: si el
   * usuario baja de nivel, se borra y el elemento vuelve a ser nuevo.
   */
  fromLevel?: true
}

/** Respuestas de un día, para la racha y las estadísticas. */
export interface DailyActivity {
  answers: number
  correct: number
}

/**
 * Todo el progreso del usuario. Los elementos que no aparecen en `items`
 * son nuevos (nunca estudiados).
 */
export interface ProgressData {
  items: Partial<Record<StudyItemId, ItemProgress>>
  activity: Record<DateKey, DailyActivity>
}
