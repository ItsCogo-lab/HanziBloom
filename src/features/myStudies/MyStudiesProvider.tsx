import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { KeyValueStorage } from '../../lib/storage.ts'
import { addSet, markSetStudied, removeSet } from './myStudies.ts'
import { MyStudiesContext, type MyStudiesContextValue } from './myStudiesContext.ts'
import { loadMyStudies, saveMyStudies } from './storage.ts'

type MyStudiesProviderProps = {
  children: ReactNode
  storage?: KeyValueStorage
}

/** Igual que ProgressProvider: carga al arrancar y guarda en cada cambio. */
export function MyStudiesProvider({ children, storage }: MyStudiesProviderProps) {
  const [myStudies, setMyStudies] = useState(() => loadMyStudies(storage))

  useEffect(() => {
    saveMyStudies(myStudies, storage)
  }, [myStudies, storage])

  const value = useMemo<MyStudiesContextValue>(
    () => ({
      myStudies,
      addSet: (setId) => setMyStudies((current) => addSet(current, setId, new Date())),
      removeSet: (setId) => setMyStudies((current) => removeSet(current, setId)),
      markSetStudied: (setId) => setMyStudies((current) => markSetStudied(current, setId, new Date())),
    }),
    [myStudies],
  )

  return <MyStudiesContext value={value}>{children}</MyStudiesContext>
}
