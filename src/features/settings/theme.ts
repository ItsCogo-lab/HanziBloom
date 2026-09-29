/**
 * Tema de colores (claro u oscuro).
 *
 * El usuario elige en Ajustes entre seguir al sistema, claro u oscuro. Los
 * colores están en index.css: el tema oscuro redefine los mismos tokens bajo
 * `html[data-theme='dark']`, así que los componentes no cambian.
 */
export const THEME_OPTIONS = ['system', 'light', 'dark'] as const

export type ThemePreference = (typeof THEME_OPTIONS)[number]

export type Theme = 'light' | 'dark'

export function isThemePreference(value: unknown): value is ThemePreference {
  return THEME_OPTIONS.some((option) => option === value)
}

/** Tema que se ve: la elección del usuario o, con «sistema», la del dispositivo. */
export function resolveTheme(preference: ThemePreference, systemPrefersDark: boolean): Theme {
  if (preference === 'system') return systemPrefersDark ? 'dark' : 'light'
  return preference
}

const DARK_QUERY = '(prefers-color-scheme: dark)'

/** Si el dispositivo pide tema oscuro. Sin matchMedia (tests) se asume claro. */
export function systemPrefersDark(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(DARK_QUERY).matches
}

/** Avisa cuando el dispositivo cambia entre claro y oscuro; devuelve cómo dejar de escuchar. */
export function subscribeToSystemTheme(onChange: () => void): () => void {
  if (typeof window.matchMedia !== 'function') return () => {}
  const query = window.matchMedia(DARK_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

/**
 * Aplica el tema a la página. index.html hace lo mismo antes de cargar la app,
 * para que no se vea un destello del tema equivocado.
 */
export function applyTheme(theme: Theme, root: HTMLElement = document.documentElement): void {
  root.dataset.theme = theme
  // Color de la barra del navegador y del sistema en móvil: el mismo que el fondo
  const paper = getComputedStyle(root).getPropertyValue('--color-paper').trim()
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (meta && paper) meta.content = paper
}
