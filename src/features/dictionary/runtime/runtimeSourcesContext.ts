import { createContext, use, useEffect, useRef, useState } from 'react'
import type { Availability, LoadOptions, RuntimeSources } from './dictionaryService.ts'

export const RuntimeSourcesContext = createContext<RuntimeSources | null>(null)

export function useRuntimeSources(): RuntimeSources {
  const sources = use(RuntimeSourcesContext)
  if (!sources) throw new Error('useRuntimeSources must be used within <RuntimeSourcesProvider>')
  return sources
}

export type RuntimeData<T> = Availability<T> | { status: 'loading' }

/**
 * Loads data with the dictionary service when `key` changes. Cancels
 * the request if the entry page closes or changes before it arrives, and
 * updates itself if a newer version of expired data arrives.
 */
export function useRuntimeData<T>(
  key: string,
  load: (sources: RuntimeSources, options: LoadOptions<T>) => Promise<Availability<T>>,
): RuntimeData<T> {
  const sources = useRuntimeSources()
  // Stored with its key so as not to show another entry page's data
  const [result, setResult] = useState<{ key: string; value: Availability<T> }>()
  // The caller creates `load` on every render; it only reloads when `key` changes
  const loadRef = useRef(load)
  useEffect(() => {
    loadRef.current = load
  })

  useEffect(() => {
    const controller = new AbortController()
    const set = (value: Availability<T>) => !controller.signal.aborted && setResult({ key, value })
    loadRef.current(sources, { signal: controller.signal, onUpdate: set }).then(set, () => {})
    return () => controller.abort()
  }, [sources, key])

  return result?.key === key ? result.value : { status: 'loading' }
}
