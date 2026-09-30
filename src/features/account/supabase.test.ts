import { describe, expect, it } from 'vitest'
import { getSupabaseConfig } from './supabase.ts'

describe('getSupabaseConfig', () => {
  it('sin URL o sin clave no hay cuentas', () => {
    expect(getSupabaseConfig({})).toBeNull()
    expect(getSupabaseConfig({ VITE_SUPABASE_URL: 'https://x.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: '' })).toBeNull()
  })

  it('con las dos, devuelve el proyecto', () => {
    expect(getSupabaseConfig({ VITE_SUPABASE_URL: 'https://x.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'key' })).toEqual({
      url: 'https://x.supabase.co',
      publishableKey: 'key',
    })
  })

  it('en los tests no hay proyecto configurado', () => {
    expect(getSupabaseConfig()).toBeNull()
  })
})
