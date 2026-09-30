/**
 * Color theme (light or dark).
 *
 * In Settings the user chooses between following the system, light or dark.
 * The colors live in index.css: the dark theme redefines the same tokens under
 * `html[data-theme='dark']`, so components don't change.
 */
export const THEME_OPTIONS = ['system', 'light', 'dark'] as const

export type ThemePreference = (typeof THEME_OPTIONS)[number]

export type Theme = 'light' | 'dark'

export function isThemePreference(value: unknown): value is ThemePreference {
  return THEME_OPTIONS.some((option) => option === value)
}

/** The theme shown: the user's choice or, with "system", the device's. */
export function resolveTheme(preference: ThemePreference, systemPrefersDark: boolean): Theme {
  if (preference === 'system') return systemPrefersDark ? 'dark' : 'light'
  return preference
}

const DARK_QUERY = '(prefers-color-scheme: dark)'

/** Whether the device asks for dark theme. Without matchMedia (tests) light is assumed. */
export function systemPrefersDark(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(DARK_QUERY).matches
}

/** Notifies when the device switches between light and dark; returns how to stop listening. */
export function subscribeToSystemTheme(onChange: () => void): () => void {
  if (typeof window.matchMedia !== 'function') return () => {}
  const query = window.matchMedia(DARK_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

/**
 * Applies the theme to the page. index.html does the same before the app
 * loads, so there's no flash of the wrong theme.
 */
export function applyTheme(theme: Theme, root: HTMLElement = document.documentElement): void {
  root.dataset.theme = theme
  // Browser and system bar color on mobile: the same as the background
  const paper = getComputedStyle(root).getPropertyValue('--color-paper').trim()
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (meta && paper) meta.content = paper
}
