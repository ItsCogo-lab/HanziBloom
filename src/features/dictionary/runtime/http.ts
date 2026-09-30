/**
 * HTTP requests for the adapters. Only the adapters use this file:
 * components never call an API.
 *
 * Every failure becomes a SourceError with a `kind` the service knows
 * how to handle (use the cache, retry later, show nothing).
 */

export type SourceErrorKind =
  /** Offline, CORS or timed out. */
  | 'network'
  /** The source responded with an error (404, 500...). */
  | 'http'
  /** Too many requests (429), or our own limit. */
  | 'rate-limit'
  /** The response doesn't have the expected format. */
  | 'invalid'
  /** Cancelled because it was no longer needed (another search, the entry page closed). */
  | 'aborted'

export class SourceError extends Error {
  readonly kind: SourceErrorKind
  readonly status?: number
  /** Milliseconds the source asks to wait (Retry-After header). */
  readonly retryAfterMs?: number

  constructor(kind: SourceErrorKind, message: string, options: { status?: number; retryAfterMs?: number } = {}) {
    super(message)
    this.name = 'SourceError'
    this.kind = kind
    this.status = options.status
    this.retryAfterMs = options.retryAfterMs
  }
}

export interface FetchOptions {
  signal?: AbortSignal
  fetchFn?: typeof fetch
  /** Maximum wait time. */
  timeoutMs?: number
  /** Browser HTTP cache; 'no-cache' forces asking the server whether there's something new. */
  cache?: RequestInit['cache']
}

const DEFAULT_TIMEOUT_MS = 10_000

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

/** Retry-After in seconds or as an HTTP date. */
function parseRetryAfter(value: string | null, now = Date.now()): number | undefined {
  if (!value) return undefined
  const seconds = Number(value)
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000)
  const date = Date.parse(value)
  return Number.isNaN(date) ? undefined : Math.max(0, date - now)
}

/** Requests a JSON. Never returns an unclassified error. */
export async function fetchJson(url: string, options: FetchOptions = {}): Promise<unknown> {
  const { signal, fetchFn = fetch, timeoutMs = DEFAULT_TIMEOUT_MS, cache } = options
  if (signal?.aborted) throw new SourceError('aborted', 'Request cancelled')
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  const onAbort = () => controller.abort()
  signal?.addEventListener('abort', onAbort)
  try {
    let response: Response
    try {
      response = await fetchFn(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
        ...(cache && { cache }),
      })
    } catch (error) {
      if (signal?.aborted) throw new SourceError('aborted', 'Request cancelled')
      if (isAbort(error)) throw new SourceError('network', `Timed out after ${timeoutMs} ms`)
      throw new SourceError('network', error instanceof Error ? error.message : 'Network error')
    }
    if (response.status === 429) {
      throw new SourceError('rate-limit', 'Too many requests', {
        status: 429,
        retryAfterMs: parseRetryAfter(response.headers.get('Retry-After')),
      })
    }
    if (!response.ok)
      throw new SourceError('http', `HTTP ${response.status}`, {
        status: response.status,
      })
    try {
      return (await response.json()) as unknown
    } catch {
      if (signal?.aborted) throw new SourceError('aborted', 'Request cancelled')
      throw new SourceError('invalid', 'Response is not JSON')
    }
  } finally {
    clearTimeout(timeout)
    signal?.removeEventListener('abort', onAbort)
  }
}

export interface RateLimiter {
  /** Waits its turn and runs `task`. Fails with 'rate-limit' if the source asked to wait. */
  schedule: <T>(task: () => Promise<T>) => Promise<T>
}

/**
 * Our own per-source limit: at most `maxPerMinute` requests per minute
 * from this browser, and after a 429 no further calls until the requested
 * time has passed. That way a user who searches a lot doesn't end up
 * blocked by the source (or get the source to block everyone else).
 */
export function createRateLimiter(maxPerMinute: number, now: () => number = Date.now): RateLimiter {
  const recent: number[] = []
  let blockedUntil = 0
  return {
    schedule: async (task) => {
      const time = now()
      if (time < blockedUntil) throw new SourceError('rate-limit', 'Waiting before calling this source again')
      while (recent.length > 0 && recent[0]! <= time - 60_000) recent.shift()
      if (recent.length >= maxPerMinute) throw new SourceError('rate-limit', 'Too many requests from this browser')
      recent.push(time)
      try {
        return await task()
      } catch (error) {
        if (error instanceof SourceError && error.kind === 'rate-limit') {
          blockedUntil = now() + (error.retryAfterMs ?? 60_000)
        }
        throw error
      }
    },
  }
}
