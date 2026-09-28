import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { KeyValueStorage } from '../../lib/storage.ts'
import { loadSettings, saveSettings } from './settings.ts'
import { SettingsContext, type SettingsContextValue } from './settingsContext.ts'

type SettingsProviderProps = {
  children: ReactNode
  storage?: KeyValueStorage
}

/** Igual que ProgressProvider: carga los ajustes al arrancar y los guarda en cada cambio. */
export function SettingsProvider({ children, storage }: SettingsProviderProps) {
  const [settings, setSettings] = useState(() => loadSettings(storage))

  useEffect(() => {
    saveSettings(settings, storage)
  }, [settings, storage])

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      updateSettings: (changes) => setSettings((current) => ({ ...current, ...changes })),
    }),
    [settings],
  )

  return <SettingsContext value={value}>{children}</SettingsContext>
}
