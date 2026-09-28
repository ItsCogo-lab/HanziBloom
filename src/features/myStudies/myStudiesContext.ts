import { createContext, use } from 'react'
import type { MyStudies } from './myStudies.ts'

export interface MyStudiesContextValue {
  myStudies: MyStudies
  addSet: (setId: string) => void
  removeSet: (setId: string) => void
  markSetStudied: (setId: string) => void
}

export const MyStudiesContext = createContext<MyStudiesContextValue | null>(null)

/** Los sets que estudia el usuario. Requiere un <MyStudiesProvider> por encima. */
export function useMyStudies(): MyStudiesContextValue {
  const value = use(MyStudiesContext)
  if (!value) throw new Error('useMyStudies debe usarse dentro de <MyStudiesProvider>')
  return value
}
