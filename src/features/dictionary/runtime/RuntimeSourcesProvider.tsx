import { useState, type ReactNode } from 'react'
import { createBrowserCache, type DictionaryCache } from './dictionaryCache.ts'
import { createResourceService } from './resourceService.ts'
import { RuntimeSourcesContext } from './runtimeSourcesContext.ts'

type RuntimeSourcesProviderProps = {
  children: ReactNode
  /** Where responses are stored; IndexedDB by default. */
  cache?: DictionaryCache
  /** By default, the browser's fetch. Tests pass a fake one. */
  fetchFn?: typeof fetch
}

/** Gives the app the service that queries external sources (full dictionary, strokes, sentences). */
export function RuntimeSourcesProvider({ children, cache, fetchFn }: RuntimeSourcesProviderProps) {
  const [sources] = useState(() => {
    const store = cache ?? createBrowserCache()
    return {
      resources: createResourceService(store),
      cache: store,
      // Without binding, some browsers throw "Illegal invocation"
      fetchFn: fetchFn ?? ((input: RequestInfo | URL, init?: RequestInit) => fetch(input, init)),
    }
  })
  return <RuntimeSourcesContext value={sources}>{children}</RuntimeSourcesContext>
}
