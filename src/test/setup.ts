// Adds matchers like toBeInTheDocument() to expect()
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'
import { offlineFetch } from './fakeFetch.ts'

beforeEach(() => {
  // Tests never go to the internet: without a fake fetch, everything is "offline"
  vi.stubGlobal('fetch', offlineFetch)
})

afterEach(() => {
  // Unmounts rendered components between tests
  cleanup()
  // Each test starts with no saved progress
  localStorage.clear()
  vi.unstubAllGlobals()
})
