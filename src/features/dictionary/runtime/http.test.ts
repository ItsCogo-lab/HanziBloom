import { describe, expect, it } from 'vitest'
import { createFakeFetch, jsonResponse } from '../../../test/fakeFetch.ts'
import { createRateLimiter, fetchJson, SourceError } from './http.ts'

async function errorOf(promise: Promise<unknown>): Promise<SourceError> {
  try {
    await promise
  } catch (error) {
    if (error instanceof SourceError) return error
    throw error
  }
  throw new Error('Expected a SourceError')
}

describe('fetchJson', () => {
  it('devuelve el JSON de una respuesta correcta', async () => {
    const { fetch } = createFakeFetch([['https://a.test/', jsonResponse({ ok: 1 })]])
    await expect(fetchJson('https://a.test/x', { fetchFn: fetch })).resolves.toEqual({ ok: 1 })
  })

  it('clasifica los errores HTTP, los 429 y las respuestas que no son JSON', async () => {
    const { fetch } = createFakeFetch([
      ['https://a.test/404', new Response('', { status: 404 })],
      ['https://a.test/429', new Response('', { status: 429, headers: { 'Retry-After': '30' } })],
      ['https://a.test/html', new Response('<html>', { status: 200 })],
    ])
    const notFound = await errorOf(fetchJson('https://a.test/404', { fetchFn: fetch }))
    expect(notFound).toMatchObject({ kind: 'http', status: 404 })
    const limited = await errorOf(fetchJson('https://a.test/429', { fetchFn: fetch }))
    expect(limited).toMatchObject({
      kind: 'rate-limit',
      status: 429,
      retryAfterMs: 30_000,
    })
    const html = await errorOf(fetchJson('https://a.test/html', { fetchFn: fetch }))
    expect(html.kind).toBe('invalid')
  })

  it('distingue sin conexión, tiempo agotado y cancelado', async () => {
    const offline = await errorOf(fetchJson('https://a.test/', { fetchFn: createFakeFetch().fetch }))
    expect(offline.kind).toBe('network')

    const hanging: typeof fetch = (_url, init) =>
      new Promise((_resolve, reject) =>
        init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError'))),
      )
    const timedOut = await errorOf(fetchJson('https://a.test/', { fetchFn: hanging, timeoutMs: 5 }))
    expect(timedOut.kind).toBe('network')

    const controller = new AbortController()
    const request = fetchJson('https://a.test/', {
      fetchFn: hanging,
      signal: controller.signal,
    })
    controller.abort()
    expect((await errorOf(request)).kind).toBe('aborted')
  })
})

describe('createRateLimiter', () => {
  it('no deja pasar más peticiones por minuto de las permitidas', async () => {
    let time = 0
    const limiter = createRateLimiter(2, () => time)
    const task = async () => 'ok'
    await limiter.schedule(task)
    await limiter.schedule(task)
    expect((await errorOf(limiter.schedule(task))).kind).toBe('rate-limit')
    time = 60_001
    await expect(limiter.schedule(task)).resolves.toBe('ok')
  })

  it('después de un 429 espera lo que pide la fuente antes de volver a llamar', async () => {
    let time = 0
    let calls = 0
    const limiter = createRateLimiter(100, () => time)
    const limited = async () => {
      calls++
      throw new SourceError('rate-limit', 'Too many requests', {
        status: 429,
        retryAfterMs: 10_000,
      })
    }
    await errorOf(limiter.schedule(limited))
    await errorOf(limiter.schedule(async () => calls++))
    expect(calls).toBe(1)
    time = 10_001
    await limiter.schedule(async () => calls++)
    expect(calls).toBe(2)
  })
})
