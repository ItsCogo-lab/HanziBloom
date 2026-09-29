import { useEffect, useLayoutEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react'
import type { KeyValueStorage } from '../../lib/storage.ts'
import { loadSettings, saveSettings } from './settings.ts'
import { SettingsContext, type SettingsContextValue } from './settingsContext.ts'
import { applyTheme, resolveTheme, subscribeToSystemTheme, systemPrefersDark } from './theme.ts'

type SettingsProviderProps = {
  children: ReactNode
  storage?: KeyValueStorage
}

/** Igual que ProgressProvider: carga los ajustes al arrancar y los guarda en cada cambio. */
export function SettingsProvider({ children, storage }: SettingsProviderProps) {
  const [settings, setSettings] = useState(() => loadSettings(storage))
  const prefersDark = useSyncExternalStore(subscribeToSystemTheme, systemPrefersDark)
  const theme = resolveTheme(settings.theme, prefersDark)

  useEffect(() => {
    saveSettings(settings, storage)
  }, [settings, storage])

  // De layout y no normal: así el tema ya está puesto cuando los efectos de los
  // hijos (como el orden de trazos) leen los colores de la página
  useLayoutEffect(() => {
    applyTheme(theme)
  }, [theme])

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      theme,
      updateSettings: (changes) => setSettings((current) => ({ ...current, ...changes })),
    }),
    [settings, theme],
  )

  return <SettingsContext value={value}>{children}</SettingsContext>
}
