import type { MessageKey } from '../i18n/index.ts'

export type NavigationItem = {
  path: string
  labelKey: MessageKey
  /** Carácter decorativo que hace de icono (no lo leen los lectores de pantalla). */
  symbol: string
}

/**
 * Secciones de la navegación principal. Añadir una sección nueva = añadir
 * una entrada aquí y su <Route> en AppRoutes. Estadísticas y Ajustes se
 * abren desde el perfil.
 */
export const NAVIGATION_ITEMS: readonly NavigationItem[] = [
  { path: '/', labelKey: 'nav.dashboard', symbol: '首' },
  { path: '/study', labelKey: 'nav.study', symbol: '学' },
  { path: '/dictionary', labelKey: 'nav.dictionary', symbol: '典' },
  { path: '/profile', labelKey: 'nav.profile', symbol: '我' },
]
