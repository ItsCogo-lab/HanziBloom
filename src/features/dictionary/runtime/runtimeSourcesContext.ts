import { createContext, use, useEffect, useRef, useState } from 'react'
import type { Availability, LoadOptions, RuntimeSources } from './dictionaryService.ts'

export const RuntimeSourcesContext = createContext<RuntimeSources | null>(null)

export function useRuntimeSources(): RuntimeSources {
  const sources = use(RuntimeSourcesContext)
  if (!sources) throw new Error('useRuntimeSources debe usarse dentro de <RuntimeSourcesProvider>')
  return sources
}

export type RuntimeData<T> = Availability<T> | { status: 'loading' }

/**
 * Carga un dato con el servicio del diccionario cuando cambia `key`. Cancela
 * la petición si la ficha se cierra o cambia antes de que llegue, y se
 * actualiza sola si llega una versión más nueva de un dato caducado.
 */
export function useRuntimeData<T>(
  key: string,
  load: (sources: RuntimeSources, options: LoadOptions<T>) => Promise<Availability<T>>,
): RuntimeData<T> {
  const sources = useRuntimeSources()
  // Se guarda con su clave para no mostrar el dato de otra ficha
  const [result, setResult] = useState<{ key: string; value: Availability<T> }>()
  // Quien llama crea `load` en cada render; solo se vuelve a cargar cuando cambia `key`
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
