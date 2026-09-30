/**
 * Conexión con Supabase (cuentas y copia en la nube). La librería se carga
 * solo cuando hay proyecto configurado, así quien no inicia sesión no la
 * descarga al abrir la app.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { CloudStore } from '../sync/sync.ts'
import { parseSnapshot } from '../sync/snapshot.ts'

export interface SupabaseConfig {
  url: string
  publishableKey: string
}

/** Proyecto de Supabase de `.env.production` / `.env.development`; `null` si no hay (y entonces no hay cuentas). */
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
      // PKCE: al volver de Google o del enlace del email, la URL trae un
      // ?code= de un solo uso en lugar de los tokens
      auth: { flowType: 'pkce' },
    }),
  )
  return clientPromise
}

/** Tabla con una fila por usuario (ver supabase/schema.sql). */
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
