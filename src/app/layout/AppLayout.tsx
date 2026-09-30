import { Outlet } from 'react-router'
import { InstallBanner } from '../../features/install/components/InstallBanner.tsx'
import { t } from '../../i18n/index.ts'
import { MainNavigation } from './MainNavigation.tsx'

/** Layout shared by every page: navigation + content of the current route. */
export function AppLayout() {
  return (
    <div className="min-h-dvh md:flex">
      {/* First focusable element: lets keyboard users skip the navigation */}
      <a
        href="#main-content"
        className="sr-only z-20 rounded-lg bg-surface shadow-md focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:px-4 focus:py-2"
      >
        {t('app.skipToContent')}
      </a>

      <MainNavigation />

      {/* The bottom padding leaves room for the fixed navigation bar on mobile */}
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 px-4 pt-4 pb-[calc(var(--mobile-nav-height)+2.5rem)] outline-none sm:px-6 sm:pt-6 md:px-10 md:py-10"
      >
        <div className="mx-auto max-w-5xl">
          <Outlet />
        </div>
      </main>

      <InstallBanner />
    </div>
  )
}
