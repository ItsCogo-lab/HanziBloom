import { useMemo } from 'react'
import { toStudySet } from '../customSets/customSets.ts'
import { useCustomSets } from '../customSets/customSetsContext.ts'
import { hskDictionary } from '../dictionary/hskDictionary.ts'
import { getStudyItem } from '../dictionary/studyItem.ts'
import { appStudySets } from './appStudySets.ts'
import type { StudySet } from './types.ts'

/** Todos los sets: los de la app (HSK y temas) y los del usuario, con el mismo modelo. */
export function useStudySets(): readonly StudySet[] {
  const { customSets } = useCustomSets()
  return useMemo(
    () => [
      ...appStudySets,
      ...customSets.map((set) => toStudySet(set, (itemId) => getStudyItem(hskDictionary, itemId) !== undefined)),
    ],
    [customSets],
  )
}
