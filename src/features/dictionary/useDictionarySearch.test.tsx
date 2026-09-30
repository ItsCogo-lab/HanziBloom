import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createChunkLoader } from '../../test/dictionaryChunks.ts'
import { DictionaryProvider } from './DictionaryProvider.tsx'
import { hskStudyItems } from './hskDictionary.ts'
import { createMemoryCache } from './runtime/dictionaryCache.ts'
import { RuntimeSourcesProvider } from './runtime/RuntimeSourcesProvider.tsx'
import * as search from './search.ts'
import { getStudyItemId } from './studyItem.ts'
import { cachedSearch, isLongEnough, SEARCH_DEBOUNCE_MS, useDictionarySearch } from './useDictionarySearch.ts'

function wrapper({ children }: { children: ReactNode }) {
  return (
    <RuntimeSourcesProvider cache={createMemoryCache()}>
      <DictionaryProvider loadChunk={createChunkLoader()}>{children}</DictionaryProvider>
    </RuntimeSourcesProvider>
  )
}

function renderSearch(initial = '') {
  return renderHook(({ query }) => useDictionarySearch(query), { wrapper, initialProps: { query: initial } })
}

describe('isLongEnough', () => {
  it('one hanzi is enough; pinyin or English need two letters', () => {
    expect(isLongEnough('果')).toBe(true)
    expect(isLongEnough('a')).toBe(false)
    expect(isLongEnough(' a ')).toBe(false)
    expect(isLongEnough('ai')).toBe(true)
  })
})

describe('useDictionarySearch', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('does not search until typing stops and only searches the latest input', async () => {
    const spy = vi.spyOn(search, 'searchItems')
    const { result, rerender } = renderSearch()
    for (const query of ['a', 'ap', 'app', 'appl', 'apple']) rerender({ query })
    expect(result.current.status).toBe('pending')
    expect(spy).not.toHaveBeenCalled()

    await act(() => vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS))
    expect(result.current.status).toBe('ready')
    // Intermediate searches are cancelled: only "apple" is searched (once with HSK, once with everything)
    expect(new Set(spy.mock.calls.map(([, query]) => query))).toEqual(new Set(['apple']))
    expect(result.current.results[0]!.entry.hanzi).toBe('苹果')
  })

  it('with less than the minimum text it does not search and says so', async () => {
    const spy = vi.spyOn(search, 'searchItems')
    const { result } = renderSearch('a')
    await act(() => vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS))
    expect(result.current).toMatchObject({ status: 'too-short', results: [] })
    expect(spy).not.toHaveBeenCalled()
  })

  it('keeps the order: exact first and HSK before the rest', async () => {
    const { result } = renderSearch('企鹅')
    await act(() => vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS))
    expect(result.current.dictionary).toBe('complete')
    expect(getStudyItemId(result.current.results[0]!)).toBe('word:企鹅')
  })
})

describe('cachedSearch', () => {
  it('repeating a recent search does not walk the dictionary again', () => {
    const spy = vi.spyOn(search, 'searchItems')
    const first = cachedSearch(hskStudyItems, 'Hao ', 10)
    const second = cachedSearch(hskStudyItems, 'hao', 10)
    expect(second).toBe(first)
    expect(spy).toHaveBeenCalledTimes(1)
    vi.restoreAllMocks()
  })
})
