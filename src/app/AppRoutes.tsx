import { Route, Routes } from 'react-router'
import { CharactersPage } from '../pages/CharactersPage.tsx'
import { DashboardPage } from '../pages/DashboardPage.tsx'
import { EntryDetailPage } from '../pages/EntryDetailPage.tsx'
import { NotFoundPage } from '../pages/NotFoundPage.tsx'
import { PracticePage } from '../pages/PracticePage.tsx'
import { ProgressPage } from '../pages/ProgressPage.tsx'
import { SettingsPage } from '../pages/SettingsPage.tsx'
import { VocabularyPage } from '../pages/VocabularyPage.tsx'
import { AppLayout } from './layout/AppLayout.tsx'

/**
 * Mapa de rutas de la aplicación. Está separado de <App> para poder
 * probarlo en los tests con un MemoryRouter en lugar del router del navegador.
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="practice" element={<PracticePage />} />
        <Route path="vocabulary" element={<VocabularyPage />} />
        <Route path="vocabulary/:id" element={<EntryDetailPage kind="word" />} />
        <Route path="characters" element={<CharactersPage />} />
        <Route path="characters/:id" element={<EntryDetailPage kind="character" />} />
        <Route path="progress" element={<ProgressPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
