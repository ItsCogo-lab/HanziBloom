import { useEffect, useLayoutEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react'
import type { KeyValueStorage } from '../../lib/storage.ts'
import { loadSettings, saveSettings } from './settings.ts'
import { SettingsContext, type SettingsContextValue } from './settingsContext.ts'
import { applyTheme, resolveTheme, subscribeToSystemTheme, systemPrefersDark } from './theme.ts'

type SettingsProviderProps = {
  children: ReactNode
  storage?: KeyValueStorage
}

/** Same as ProgressProvider: loads settings at startup and saves them on every change. */
export function SettingsProvider({ children, storage }: SettingsProviderProps) {
  const [settings, setSettings] = useState(() => loadSettings(storage))
  const prefersDark = useSyncExternalStore(subscribeToSystemTheme, systemPrefersDark)
  const theme = resolveTheme(settings.theme, prefersDark)

  useEffect(() => {
    saveSettings(settings, storage)
  }, [settings, storage])

  // A layout effect rather than a normal one: that way the theme is already set
  // when the children's effects (like stroke order) read the page colors
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
