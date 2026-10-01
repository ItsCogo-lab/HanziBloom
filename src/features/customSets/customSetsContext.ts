import { createContext, use } from 'react'
import type { StudyItemId } from '../dictionary/studyItem.ts'
import type { CustomSentence, CustomSet, CustomSetDetails } from './types.ts'

export interface CustomSetsContextValue {
  customSets: readonly CustomSet[]
  /**
   * Creates a set and returns its id. The data must already be validated
   * (validateDetails); `itemIds` (an imported set) must exist in the dictionary.
   */
  createSet: (details: CustomSetDetails, itemIds?: readonly StudyItemId[]) => string
  updateDetails: (setId: string, details: CustomSetDetails) => void
  deleteSet: (setId: string) => void
  addItem: (setId: string, itemId: StudyItemId) => void
  removeItem: (setId: string, itemId: StudyItemId) => void
  /** Saves an already validated custom meaning (validateMeaning). */
  setMeaning: (setId: string, itemId: StudyItemId, meaning: string) => void
  deleteMeaning: (setId: string, itemId: StudyItemId) => void
  /** Adds an already processed sentence (processSentence). */
  addSentence: (setId: string, sentence: Pick<CustomSentence, 'chinese' | 'tokens' | 'itemId'>) => void
  updateSentence: (setId: string, sentenceId: string, change: Pick<CustomSentence, 'chinese' | 'tokens'>) => void
  deleteSentence: (setId: string, sentenceId: string) => void
}

export const CustomSetsContext = createContext<CustomSetsContextValue | null>(null)

/** The user's sets and actions to change them. Requires a <CustomSetsProvider> above. */
export function useCustomSets(): CustomSetsContextValue {
  const value = use(CustomSetsContext)
  if (!value) throw new Error('useCustomSets must be used within <CustomSetsProvider>')
  return value
}

/** The saved data of a custom set (with its notes), or `undefined` if it is not a custom set. */
export function useCustomSet(setId: string | undefined): CustomSet | undefined {
  const { customSets } = useCustomSets()
  return setId === undefined ? undefined : customSets.find((set) => set.id === setId)
}
