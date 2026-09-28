import { createContext, use } from 'react'
import type { Settings } from './settings.ts'

export interface SettingsContextValue {
  settings: Settings
  updateSettings: (changes: Partial<Settings>) => void
}

export const SettingsContext = createContext<SettingsContextValue | null>(null)

/** Ajustes del usuario. Requiere un <SettingsProvider> por encima. */
export function useSettings(): SettingsContextValue {
  const value = use(SettingsContext)
  if (!value) throw new Error('useSettings debe usarse dentro de <SettingsProvider>')
  return value
}
