import { createContext, use } from 'react'

export interface AccountUser {
  id: string
  email: string | null
}

/** Estado de la copia en la nube: `idle` sin sesión, `error` si la última vez falló (se reintenta sola). */
export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error'

export interface AccountContextValue {
  /** Hay proyecto de Supabase configurado. Si no, la app funciona sin cuentas. */
  enabled: boolean
  /** Aún no se sabe si hay sesión (se está cargando). */
  loading: boolean
  user: AccountUser | null
  syncStatus: SyncStatus
  /** Lleva a la página de Google; al volver, la sesión ya está iniciada. */
  signInWithGoogle: () => Promise<void>
  /** Manda un email con un enlace para entrar sin contraseña. */
  sendEmailLink: (email: string) => Promise<void>
  signOut: () => Promise<void>
}

const noAccounts: AccountContextValue = {
  enabled: false,
  loading: false,
  user: null,
  syncStatus: 'idle',
  signInWithGoogle: () => Promise.resolve(),
  sendEmailLink: () => Promise.resolve(),
  signOut: () => Promise.resolve(),
}

export const AccountContext = createContext<AccountContextValue>(noAccounts)

/** La cuenta del usuario, si la hay. Sin <AccountProvider> la app funciona sin cuentas. */
export function useAccount(): AccountContextValue {
  return use(AccountContext)
}
