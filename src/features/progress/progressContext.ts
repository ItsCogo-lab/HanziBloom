import { createContext, use } from 'react'
import type { StudyItemId } from '../dictionary/studyItem.ts'
import type { ProgressData } from './types.ts'

export interface ProgressContextValue {
  progress: ProgressData
  recordAnswer: (itemId: StudyItemId, correct: boolean) => void
  resetProgress: () => void
}

export const ProgressContext = createContext<ProgressContextValue | null>(null)

/** Progreso del usuario y acciones para cambiarlo. Requiere un <ProgressProvider> por encima. */
export function useProgress(): ProgressContextValue {
  const value = use(ProgressContext)
  if (!value) throw new Error('useProgress debe usarse dentro de <ProgressProvider>')
  return value
}
