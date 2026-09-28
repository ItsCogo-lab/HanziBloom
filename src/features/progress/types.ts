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
