import { useMemo } from 'react'
import { toStudySet } from '../customSets/customSets.ts'
import { useCustomSets } from '../customSets/customSetsContext.ts'
import { appStudySets } from './appStudySets.ts'
import type { StudySet } from './types.ts'

/** All sets: the app's (HSK and topics) and the user's, with the same model. */
export function useStudySets(): readonly StudySet[] {
  const { customSets } = useCustomSets()
  return useMemo(
    () => [
      ...appStudySets,
      ...customSets.map(toStudySet),
    ],
    [customSets],
  )
}
