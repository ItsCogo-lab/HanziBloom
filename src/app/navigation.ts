import type { MessageKey } from '../i18n/index.ts'

export type NavigationItem = {
  path: string
  labelKey: MessageKey
  /** Carácter decorativo que hace de icono (no lo leen los lectores de pantalla). */
  symbol: string
}

/**
 * Secciones de la navegación principal. Añadir una sección nueva = añadir
 * una entrada aquí y su <Route> en AppRoutes.
 */
export const NAVIGATION_ITEMS: readonly NavigationItem[] = [
  { path: '/', labelKey: 'nav.dashboard', symbol: '首' },
  { path: '/practice', labelKey: 'nav.practice', symbol: '练' },
  { path: '/vocabulary', labelKey: 'nav.vocabulary', symbol: '词' },
  { path: '/characters', labelKey: 'nav.characters', symbol: '字' },
  { path: '/progress', labelKey: 'nav.progress', symbol: '进' },
  { path: '/settings', labelKey: 'nav.settings', symbol: '设' },
]
