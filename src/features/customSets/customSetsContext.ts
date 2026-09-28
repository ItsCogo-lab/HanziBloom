import { createContext, use } from 'react'
import type { StudyItemId } from '../dictionary/studyItem.ts'
import type { CustomSet, CustomSetDetails } from './types.ts'

export interface CustomSetsContextValue {
  customSets: readonly CustomSet[]
  /** Crea un set y devuelve su id. Los datos ya deben venir validados (validateDetails). */
  createSet: (details: CustomSetDetails) => string
  updateDetails: (setId: string, details: CustomSetDetails) => void
  deleteSet: (setId: string) => void
  addItem: (setId: string, itemId: StudyItemId) => void
  removeItem: (setId: string, itemId: StudyItemId) => void
}

export const CustomSetsContext = createContext<CustomSetsContextValue | null>(null)

/** Los sets del usuario y acciones para cambiarlos. Requiere un <CustomSetsProvider> por encima. */
export function useCustomSets(): CustomSetsContextValue {
  const value = use(CustomSetsContext)
  if (!value) throw new Error('useCustomSets debe usarse dentro de <CustomSetsProvider>')
  return value
}
