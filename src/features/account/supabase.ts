/**
 * Connection to Supabase (accounts and cloud copy). The library is only
 * loaded when a project is configured, so people who don't sign in don't
 * download it when opening the app.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { CloudStore } from '../sync/sync.ts'
import { parseSnapshot } from '../sync/snapshot.ts'

export interface SupabaseConfig {
  url: string
  publishableKey: string
}

/** Supabase project from `.env.production` / `.env.development`; `null` if there is none (and then there are no accounts). */
export function getSupabaseConfig(env: Record<string, unknown> = import.meta.env): SupabaseConfig | null {
  const url = env.VITE_SUPABASE_URL
  const publishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (typeof url !== 'string' || typeof publishableKey !== 'string' || url === '' || publishableKey === '') return null
  return { url, publishableKey }
}

let clientPromise: Promise<SupabaseClient> | null = null

export function loadSupabaseClient(config: SupabaseConfig): Promise<SupabaseClient> {
  clientPromise ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(config.url, config.publishableKey, {
      // PKCE: on returning from Google or the email link, the URL carries a
      // single-use ?code= instead of the tokens
      auth: { flowType: 'pkce' },
    }),
  )
  return clientPromise
}

/** Table with one row per user (see supabase/schema.sql). */
const TABLE = 'user_data'

export function createSupabaseCloud(client: SupabaseClient): CloudStore {
  return {
    load: async (userId) => {
      const { data, error } = await client.from(TABLE).select('data, updated_at').eq('user_id', userId).maybeSingle()
      if (error) throw error
      if (!data) return null
      const row = data as { data: unknown; updated_at: string }
      return { data: parseSnapshot(row.data), updatedAt: row.updated_at }
    },
    save: async (userId, data) => {
      const { data: saved, error } = await client
        .from(TABLE)
        .upsert({ user_id: userId, data, updated_at: new Date().toISOString() })
        .select('updated_at')
        .single()
      if (error) throw error
      return (saved as { updated_at: string }).updated_at
    },
  }
}
