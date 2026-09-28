import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { KeyValueStorage } from '../../lib/storage.ts'
import { createEmptyProgress, introduceItem, recordAnswer } from './progress.ts'
import { ProgressContext, type ProgressContextValue } from './progressContext.ts'
import { loadProgress, saveProgress } from './storage.ts'

type ProgressProviderProps = {
  children: ReactNode
  /** Dónde guardar; por defecto localStorage. Los tests pasan uno en memoria. */
  storage?: KeyValueStorage
}

/**
 * Guarda el progreso en el estado de React y lo sincroniza con el
 * almacenamiento: se carga una vez al arrancar y se guarda en cada cambio.
 */
export function ProgressProvider({ children, storage }: ProgressProviderProps) {
  const [progress, setProgress] = useState(() => loadProgress(storage))

  useEffect(() => {
    saveProgress(progress, storage)
  }, [progress, storage])

  const value = useMemo<ProgressContextValue>(
    () => ({
      progress,
      recordAnswer: (itemId, correct) => setProgress((current) => recordAnswer(current, itemId, correct, new Date())),
      introduceItem: (itemId) => setProgress((current) => introduceItem(current, itemId, new Date())),
      resetProgress: () => setProgress(createEmptyProgress()),
    }),
    [progress],
  )

  return <ProgressContext value={value}>{children}</ProgressContext>
}
