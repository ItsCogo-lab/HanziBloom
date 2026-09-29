import { createContext, use } from 'react'
import type { StudyItemId } from '../dictionary/studyItem.ts'
import type { CustomSentence, CustomSet, CustomSetDetails } from './types.ts'

export interface CustomSetsContextValue {
  customSets: readonly CustomSet[]
  /** Crea un set y devuelve su id. Los datos ya deben venir validados (validateDetails). */
  createSet: (details: CustomSetDetails) => string
  updateDetails: (setId: string, details: CustomSetDetails) => void
  deleteSet: (setId: string) => void
  addItem: (setId: string, itemId: StudyItemId) => void
  removeItem: (setId: string, itemId: StudyItemId) => void
  /** Guarda un significado propio ya validado (validateMeaning). */
  setMeaning: (setId: string, itemId: StudyItemId, meaning: string) => void
  deleteMeaning: (setId: string, itemId: StudyItemId) => void
  /** Añade una frase ya procesada (processSentence). */
  addSentence: (setId: string, sentence: Pick<CustomSentence, 'chinese' | 'tokens' | 'itemId'>) => void
  updateSentence: (setId: string, sentenceId: string, change: Pick<CustomSentence, 'chinese' | 'tokens'>) => void
  deleteSentence: (setId: string, sentenceId: string) => void
}

export const CustomSetsContext = createContext<CustomSetsContextValue | null>(null)

/** Los sets del usuario y acciones para cambiarlos. Requiere un <CustomSetsProvider> por encima. */
export function useCustomSets(): CustomSetsContextValue {
  const value = use(CustomSetsContext)
  if (!value) throw new Error('useCustomSets debe usarse dentro de <CustomSetsProvider>')
  return value
}

/** Los datos guardados de un set propio (con sus notas), o `undefined` si no es un set propio. */
export function useCustomSet(setId: string | undefined): CustomSet | undefined {
  const { customSets } = useCustomSets()
  return setId === undefined ? undefined : customSets.find((set) => set.id === setId)
}
