import { createContext, use } from 'react'
import type { MyStudies } from './myStudies.ts'

export interface MyStudiesContextValue {
  myStudies: MyStudies
  addSet: (setId: string) => void
  removeSet: (setId: string) => void
  markSetStudied: (setId: string) => void
}

export const MyStudiesContext = createContext<MyStudiesContextValue | null>(null)

/** The sets the user is studying. Requires a <MyStudiesProvider> above. */
export function useMyStudies(): MyStudiesContextValue {
  const value = use(MyStudiesContext)
  if (!value) throw new Error('useMyStudies must be used within <MyStudiesProvider>')
  return value
}
