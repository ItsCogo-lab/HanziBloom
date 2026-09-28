import type { ReactNode } from 'react'
import type { KeyValueStorage } from '../lib/storage.ts'
import { MyStudiesProvider } from '../features/myStudies/MyStudiesProvider.tsx'
import { ProgressProvider } from '../features/progress/ProgressProvider.tsx'
import { SettingsProvider } from '../features/settings/SettingsProvider.tsx'

type AppProvidersProps = {
  children: ReactNode
  /** Almacenamiento de los datos del usuario; por defecto localStorage. */
  storage?: KeyValueStorage
}

/** Estado compartido por toda la app. Los tests lo usan igual que <App>. */
export function AppProviders({ children, storage }: AppProvidersProps) {
  return (
    <SettingsProvider storage={storage}>
      <ProgressProvider storage={storage}>
        <MyStudiesProvider storage={storage}>{children}</MyStudiesProvider>
      </ProgressProvider>
    </SettingsProvider>
  )
}
