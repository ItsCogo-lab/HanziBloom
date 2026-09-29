/**
 * `fetch` falso para los tests: nunca sale a internet. Cada URL se responde
 * con la primera regla que coincide; sin regla, falla como sin conexión.
 */

type Reply = Response | (() => Response | Promise<Response>)

export interface FakeFetch {
  fetch: typeof fetch
  /** URLs pedidas, en orden. */
  requested: string[]
}

export function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
}

export function createFakeFetch(routes: [match: string | RegExp, reply: Reply][] = []): FakeFetch {
  const requested: string[] = []
  const fetchFn = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    requested.push(url)
    if (init?.signal?.aborted) throw new DOMException('Aborted', 'AbortError')
    const route = routes.find(([match]) => (typeof match === 'string' ? url.startsWith(match) : match.test(url)))
    if (!route) throw new TypeError('Failed to fetch')
    const reply = route[1]
    return typeof reply === 'function' ? reply() : reply.clone()
  }
  return { fetch: fetchFn as typeof fetch, requested }
}

/** Sin conexión: todas las peticiones fallan. Es lo que usan los tests por defecto. */
export const offlineFetch: typeof fetch = createFakeFetch().fetch
