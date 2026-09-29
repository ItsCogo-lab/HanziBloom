import { useState, type ReactNode } from 'react'
import { createBrowserCache, type DictionaryCache } from './dictionaryCache.ts'
import { createResourceService } from './resourceService.ts'
import { RuntimeSourcesContext } from './runtimeSourcesContext.ts'

type RuntimeSourcesProviderProps = {
  children: ReactNode
  /** Dónde se guardan las respuestas; por defecto IndexedDB. */
  cache?: DictionaryCache
  /** Por defecto, el fetch del navegador. Los tests pasan uno falso. */
  fetchFn?: typeof fetch
}

/** Da a la app el servicio que consulta las fuentes externas (diccionario completo, trazos, frases). */
export function RuntimeSourcesProvider({ children, cache, fetchFn }: RuntimeSourcesProviderProps) {
  const [sources] = useState(() => {
    const store = cache ?? createBrowserCache()
    return {
      resources: createResourceService(store),
      cache: store,
      // Sin enlazar, algunos navegadores lanzan "Illegal invocation"
      fetchFn: fetchFn ?? ((input: RequestInfo | URL, init?: RequestInit) => fetch(input, init)),
    }
  })
  return <RuntimeSourcesContext value={sources}>{children}</RuntimeSourcesContext>
}
