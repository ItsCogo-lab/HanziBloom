/**
 * Peticiones HTTP de los adaptadores. Solo los adaptadores usan este archivo:
 * los componentes nunca llaman a una API.
 *
 * Todos los fallos se convierten en un SourceError con un `kind` que el
 * servicio sabe tratar (usar la caché, reintentar más tarde, no mostrar nada).
 */

export type SourceErrorKind =
  /** Sin conexión, CORS o tiempo agotado. */
  | 'network'
  /** La fuente ha respondido con un error (404, 500...). */
  | 'http'
  /** Demasiadas peticiones (429), o nuestro propio límite. */
  | 'rate-limit'
  /** La respuesta no tiene el formato esperado. */
  | 'invalid'
  /** Se canceló porque ya no hacía falta (otra búsqueda, se cerró la ficha). */
  | 'aborted'

export class SourceError extends Error {
  readonly kind: SourceErrorKind
  readonly status?: number
  /** Milisegundos que la fuente pide esperar (cabecera Retry-After). */
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
  /** Tiempo máximo de espera. */
  timeoutMs?: number
  /** Caché HTTP del navegador; 'no-cache' obliga a preguntar al servidor si hay algo nuevo. */
  cache?: RequestInit['cache']
}

const DEFAULT_TIMEOUT_MS = 10_000

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

/** Retry-After en segundos o como fecha HTTP. */
function parseRetryAfter(value: string | null, now = Date.now()): number | undefined {
  if (!value) return undefined
  const seconds = Number(value)
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000)
  const date = Date.parse(value)
  return Number.isNaN(date) ? undefined : Math.max(0, date - now)
}

/** Pide un JSON. Nunca devuelve un error sin clasificar. */
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
  /** Espera turno y ejecuta `task`. Falla con 'rate-limit' si la fuente pidió esperar. */
  schedule: <T>(task: () => Promise<T>) => Promise<T>
}

/**
 * Límite propio por fuente: como mucho `maxPerMinute` peticiones por minuto
 * desde este navegador, y después de un 429 no se vuelve a llamar hasta que
 * pase el tiempo pedido. Así un usuario que hace muchas búsquedas no acaba
 * bloqueado por la fuente (ni hace que la fuente bloquee a los demás).
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
