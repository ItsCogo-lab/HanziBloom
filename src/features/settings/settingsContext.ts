import { createContext, use } from 'react'
import type { Settings } from './settings.ts'
import type { Theme } from './theme.ts'

export interface SettingsContextValue {
  settings: Settings
  /** Theme shown right now, already resolved if the user chose "system". */
  theme: Theme
  updateSettings: (changes: Partial<Settings>) => void
}

export const SettingsContext = createContext<SettingsContextValue | null>(null)

/** The user's settings. Requires a <SettingsProvider> above. */
export function useSettings(): SettingsContextValue {
  const value = use(SettingsContext)
  if (!value) throw new Error('useSettings must be used within <SettingsProvider>')
  return value
}
