import { describe, expect, it } from 'vitest'
import { getSupabaseConfig } from './supabase.ts'

describe('getSupabaseConfig', () => {
  it('without a URL or key there are no accounts', () => {
    expect(getSupabaseConfig({})).toBeNull()
    expect(getSupabaseConfig({ VITE_SUPABASE_URL: 'https://x.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: '' })).toBeNull()
  })

  it('with both, returns the project', () => {
    expect(getSupabaseConfig({ VITE_SUPABASE_URL: 'https://x.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'key' })).toEqual({
      url: 'https://x.supabase.co',
      publishableKey: 'key',
    })
  })

  it('no project is configured in tests', () => {
    expect(getSupabaseConfig()).toBeNull()
  })
})
