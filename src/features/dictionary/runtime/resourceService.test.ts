import { describe, expect, it, vi } from 'vitest'
import { createMemoryCache } from './dictionaryCache.ts'
import { SourceError } from './http.ts'
import { createResourceService } from './resourceService.ts'

const TTL = 1000

function setup() {
  let time = 0
  const cache = createMemoryCache()
  const service = createResourceService(cache, () => time)
  return { cache, service, setTime: (value: number) => (time = value) }
}

describe('createResourceService', () => {
  it('without cache downloads, stores and returns the data with its source', async () => {
    const { cache, service } = setup()
    const fetch = vi.fn(async () => ({ data: 'a', source: 'src@1' }))
    const resource = await service.load({ key: 'k', ttlMs: TTL, fetch })
    expect(resource).toEqual({
      data: 'a',
      source: 'src@1',
      fetchedAt: 0,
      stale: false,
    })
    expect(await cache.get('k')).toEqual({
      key: 'k',
      data: 'a',
      source: 'src@1',
      fetchedAt: 0,
    })
  })

  it('with an up-to-date cache does not call the source', async () => {
    const { service, setTime } = setup()
    await service.load({
      key: 'k',
      ttlMs: TTL,
      fetch: async () => ({ data: 'a', source: 's' }),
    })
    setTime(TTL)
    const fetch = vi.fn(async () => ({ data: 'b', source: 's' }))
    expect((await service.load({ key: 'k', ttlMs: TTL, fetch })).data).toBe('a')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('with an expired cache returns the stored data and refreshes it in the background', async () => {
    const { cache, service, setTime } = setup()
    await service.load({
      key: 'k',
      ttlMs: TTL,
      fetch: async () => ({ data: 'a', source: 's' }),
    })
    setTime(TTL + 1)
    const onUpdate = vi.fn()
    const resource = await service.load({
      key: 'k',
      ttlMs: TTL,
      fetch: async () => ({ data: 'b', source: 's' }),
      onUpdate,
    })
    expect(resource).toMatchObject({ data: 'a', stale: true })
    await vi.waitFor(() => expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: 'b', stale: false })))
    expect((await cache.get('k'))?.data).toBe('b')
  })

  it('with an expired cache and offline keeps using the stored data', async () => {
    const { cache, service, setTime } = setup()
    await service.load({
      key: 'k',
      ttlMs: TTL,
      fetch: async () => ({ data: 'a', source: 's' }),
    })
    setTime(TTL * 10)
    const offline = async () => {
      throw new SourceError('network', 'offline')
    }
    const onUpdate = vi.fn()
    expect(await service.load({ key: 'k', ttlMs: TTL, fetch: offline, onUpdate })).toMatchObject({
      data: 'a',
      stale: true,
    })
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(onUpdate).not.toHaveBeenCalled()
    expect((await cache.get('k'))?.data).toBe('a')
  })

  it('without cache and with the source down passes the error to the caller', async () => {
    const { cache, service } = setup()
    const failing = async () => {
      throw new SourceError('http', 'HTTP 500', { status: 500 })
    }
    await expect(service.load({ key: 'k', ttlMs: TTL, fetch: failing })).rejects.toMatchObject({ kind: 'http' })
    expect(await cache.get('k')).toBeUndefined()
  })

  it('two simultaneous requests for the same key share one download', async () => {
    const { service } = setup()
    const fetch = vi.fn(async () => ({ data: 'a', source: 's' }))
    await Promise.all([service.load({ key: 'k', ttlMs: TTL, fetch }), service.load({ key: 'k', ttlMs: TTL, fetch })])
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})
