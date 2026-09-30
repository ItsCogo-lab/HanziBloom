import { Link, NavLink } from 'react-router'
import { t } from '../../i18n/index.ts'
import { NAVIGATION_ITEMS } from '../navigation.ts'

/**
 * Una sola lista de enlaces que cambia de forma según el ancho de pantalla:
 * barra inferior fija en móvil y barra lateral a partir de `md`.
 * Así no duplicamos la navegación para cada tamaño.
 */
export function MainNavigation() {
  return (
    <nav
      aria-label={t('app.mainNavigation')}
      className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:border-t-0 md:border-r md:px-4 md:py-6"
    >
      <Link
        to="/"
        className="mb-8 hidden items-center gap-3 rounded-xl px-3 text-lg font-semibold tracking-tight md:flex"
      >
        <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="" className="size-9" />
        {t('app.name')}
      </Link>

      {/* En móvil cada enlace mide justo 3.5rem (--mobile-nav-height en index.css) */}
      <ul className="grid grid-cols-4 md:flex md:flex-col md:gap-1">
        {NAVIGATION_ITEMS.map((item) => (
          <li key={item.path}>
            <NavLink
              to={item.path}
              // Sin `end`, «Inicio» (/) aparecería activo en todas las rutas
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex h-14 flex-col items-center justify-center gap-0.5 px-1 text-[0.6875rem] font-medium tracking-tight transition-colors md:h-auto md:flex-row md:justify-start md:gap-3 md:rounded-xl md:px-3 md:py-2.5 md:text-base md:tracking-normal ${
                  isActive
                    ? 'text-accent-strong md:bg-accent-soft'
                    : 'text-ink-muted hover:text-ink md:hover:bg-paper'
                }`
              }
            >
              <span aria-hidden="true" className="font-hanzi text-xl leading-none">
                {item.symbol}
              </span>
              {t(item.labelKey)}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
