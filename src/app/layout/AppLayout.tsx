import { Outlet } from 'react-router'
import { t } from '../../i18n/index.ts'
import { MainNavigation } from './MainNavigation.tsx'

/** Estructura común a todas las páginas: navegación + contenido de la ruta actual. */
export function AppLayout() {
  return (
    <div className="min-h-screen md:flex">
      {/* Primer elemento enfocable: permite saltar la navegación con el teclado */}
      <a
        href="#main-content"
        className="sr-only z-20 rounded-lg bg-surface shadow-md focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:px-4 focus:py-2"
      >
        {t('app.skipToContent')}
      </a>

      <MainNavigation />

      {/* pb-24 deja sitio para la barra inferior fija en móvil */}
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none px-4 pt-6 pb-24 sm:px-6 md:px-10 md:py-10">
        <div className="mx-auto max-w-5xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
