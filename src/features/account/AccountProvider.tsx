import type { SupabaseClient } from '@supabase/supabase-js'
import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { getBrowserStorage, type KeyValueStorage } from '../../lib/storage.ts'
import { observeStorage } from '../sync/observeStorage.ts'
import { isSyncedKey } from '../sync/snapshot.ts'
import { syncUserData } from '../sync/sync.ts'
import { clearSyncState, markSyncDirty } from '../sync/syncState.ts'
import { AccountContext, type AccountContextValue, type AccountUser, type SyncStatus } from './accountContext.ts'
import { createSupabaseCloud, getSupabaseConfig, loadSupabaseClient, type SupabaseConfig } from './supabase.ts'

const DEFAULT_CONFIG = getSupabaseConfig()

/** Espera tras el último cambio antes de subirlo: una sesión de práctica cambia el progreso en cada respuesta. */
const PUSH_DELAY_MS = 3000

type AccountProviderProps = {
  /** Recibe el almacenamiento que deben usar los datos del usuario. */
  children: (storage: KeyValueStorage | undefined) => ReactNode
  storage?: KeyValueStorage
  /** Proyecto de Supabase; por defecto el de `.env.*`. `null` desactiva las cuentas. */
  config?: SupabaseConfig | null
}

/**
 * Cuenta opcional y sincronización. Sin sesión, todo sigue en localStorage
 * como siempre. Con sesión, cada cambio de los datos del usuario se sube a
 * Supabase (agrupados) y, al entrar o volver a la app, se bajan los cambios
 * de otros dispositivos (ver sync/syncUserData).
 *
 * Los Providers de datos cargan una sola vez al montarse, así que cuando la
 * sincronización cambia lo guardado se vuelven a montar con otra `key`.
 */
export function AccountProvider({ children, storage, config = DEFAULT_CONFIG }: AccountProviderProps) {
  const baseStorage = storage ?? getBrowserStorage()
  const [dataVersion, setDataVersion] = useState(0)
  const [client, setClient] = useState<SupabaseClient | null>(null)
  const [user, setUser] = useState<AccountUser | null>(null)
  const [loading, setLoading] = useState(config !== null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')

  const changes = useRef(0)
  const session = useRef<{ client: SupabaseClient; userId: string } | null>(null)
  const running = useRef(false)
  const runAgain = useRef(false)
  const pushTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const sync = useCallback(async () => {
    if (running.current) {
      runAgain.current = true
      return
    }
    running.current = true
    try {
      do {
        runAgain.current = false
        const current = session.current
        if (!current) return
        setSyncStatus('syncing')
        const localChanged = await syncUserData({
          cloud: createSupabaseCloud(current.client),
          userId: current.userId,
          storage: baseStorage,
          changeCount: () => changes.current,
        })
        if (localChanged) setDataVersion((version) => version + 1)
        setSyncStatus('synced')
      } while (runAgain.current)
    } catch {
      // Sin conexión o Supabase caído: los cambios quedan marcados y se suben la próxima vez
      setSyncStatus('error')
    } finally {
      running.current = false
    }
  }, [baseStorage])

  // Cada cambio de los datos del usuario se apunta y, con sesión, se sube al rato
  const handleChange = useCallback(
    (key: string) => {
      if (!isSyncedKey(key)) return
      changes.current += 1
      markSyncDirty(baseStorage)
      if (!session.current) return
      clearTimeout(pushTimer.current)
      pushTimer.current = setTimeout(() => void sync(), PUSH_DELAY_MS)
    },
    [baseStorage, sync],
  )
  // El almacenamiento se crea una sola vez; el aviso de cambios pasa por
  // `listener` para usar siempre la última versión de handleChange
  const [listener] = useState(createListener)
  useEffect(() => listener.set(handleChange), [listener, handleChange])
  const userStorage = useMemo(
    () => baseStorage && observeStorage(baseStorage, listener.call),
    [baseStorage, listener],
  )

  // Carga Supabase y escucha la sesión. Al volver de Google o del email, la
  // librería canjea el ?code= de la URL y avisa aquí con la sesión nueva.
  useEffect(() => {
    if (!config) return
    let unsubscribe: (() => void) | undefined
    let cancelled = false
    loadSupabaseClient(config)
      .then((loaded) => {
        if (cancelled) return
        setClient(loaded)
        const { data } = loaded.auth.onAuthStateChange((_event, authSession) => {
          const authUser = authSession?.user
          setUser((previous) => {
            if (!authUser) return null
            return previous?.id === authUser.id ? previous : { id: authUser.id, email: authUser.email ?? null }
          })
          setLoading(false)
        })
        unsubscribe = () => data.subscription.unsubscribe()
      })
      .catch(() => setLoading(false))
    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [config])

  // Con sesión: sincroniza ahora, y otra vez cada vez que se vuelve a la app
  useEffect(() => {
    if (!client || !user) {
      session.current = null
      return
    }
    session.current = { client, userId: user.id }
    removeAuthCodeFromUrl()
    const firstSync = setTimeout(() => void sync(), 0)

    const syncWhenVisible = () => {
      if (document.visibilityState === 'visible') void sync()
    }
    document.addEventListener('visibilitychange', syncWhenVisible)
    window.addEventListener('online', syncWhenVisible)
    return () => {
      document.removeEventListener('visibilitychange', syncWhenVisible)
      window.removeEventListener('online', syncWhenVisible)
      clearTimeout(firstSync)
      clearTimeout(pushTimer.current)
    }
  }, [client, user, sync])

  const value = useMemo<AccountContextValue>(
    () => ({
      enabled: config !== null,
      loading,
      user,
      syncStatus: user ? syncStatus : 'idle',
      signInWithGoogle: async () => {
        if (!client) return
        const { error } = await client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: appUrl() } })
        if (error) throw error
      },
      sendEmailLink: async (email) => {
        if (!client) return
        const { error } = await client.auth.signInWithOtp({ email, options: { emailRedirectTo: appUrl() } })
        if (error) throw error
      },
      signOut: async () => {
        if (!client) return
        // Antes de salir se sube lo pendiente. Los datos se quedan en este navegador.
        clearTimeout(pushTimer.current)
        await sync()
        await client.auth.signOut()
        clearSyncState(baseStorage)
      },
    }),
    [config, loading, user, syncStatus, client, sync, baseStorage],
  )

  return (
    <AccountContext value={value}>
      <Fragment key={dataVersion}>{children(userStorage)}</Fragment>
    </AccountContext>
  )
}

/** Una función que se puede cambiar sin cambiar su referencia. */
function createListener() {
  let handler = (_key: string) => {}
  return {
    call: (key: string) => handler(key),
    set: (next: (key: string) => void) => {
      handler = next
    },
  }
}

/** Adonde vuelve el usuario tras iniciar sesión: el inicio de la app. */
function appUrl(): string {
  return new URL(import.meta.env.BASE_URL, window.location.origin).href
}

/** Quita el ?code= de un solo uso que deja el inicio de sesión, para que no se quede en la barra de direcciones. */
function removeAuthCodeFromUrl() {
  const url = new URL(window.location.href)
  if (!url.searchParams.has('code')) return
  url.searchParams.delete('code')
  window.history.replaceState(window.history.state, '', url)
}
