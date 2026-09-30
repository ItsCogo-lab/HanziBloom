/**
 * Fake `fetch` for tests: never goes to the internet. Each URL is answered
 * by the first matching rule; with no rule, it fails as if offline.
 */

type Reply = Response | (() => Response | Promise<Response>)

export interface FakeFetch {
  fetch: typeof fetch
  /** Requested URLs, in order. */
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

/** Offline: every request fails. This is what tests use by default. */
export const offlineFetch: typeof fetch = createFakeFetch().fetch
