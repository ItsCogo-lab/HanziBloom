import { afterEach, describe, expect, it, vi } from 'vitest'
import indexHtml from '../../../index.html?raw'
import { SETTINGS_STORAGE_KEY } from './settings.ts'
import { applyTheme, isThemePreference, resolveTheme, systemPrefersDark } from './theme.ts'

afterEach(() => {
  delete document.documentElement.dataset.theme
  document.head.replaceChildren()
})

describe('resolveTheme', () => {
  it('con «sistema» sigue al dispositivo', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
  })

  it('una elección explícita manda sobre el dispositivo', () => {
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
  })
})

describe('isThemePreference', () => {
  it('solo acepta las opciones disponibles', () => {
    expect(isThemePreference('dark')).toBe(true)
    expect(isThemePreference('sepia')).toBe(false)
    expect(isThemePreference(undefined)).toBe(false)
  })
})

describe('systemPrefersDark', () => {
  it('lee la preferencia del dispositivo', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query === '(prefers-color-scheme: dark)' }))
    expect(systemPrefersDark()).toBe(true)
  })

  it('sin matchMedia asume tema claro', () => {
    vi.stubGlobal('matchMedia', undefined)
    expect(systemPrefersDark()).toBe(false)
  })
})

describe('applyTheme', () => {
  it('marca el tema en <html> y pinta la barra del navegador con el fondo', () => {
    const meta = document.createElement('meta')
    meta.name = 'theme-color'
    meta.content = '#fbf8f3'
    document.head.append(meta)
    document.documentElement.style.setProperty('--color-paper', '#161412')

    applyTheme('dark')

    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(meta.content).toBe('#161412')
    document.documentElement.style.removeProperty('--color-paper')
  })
})

describe('index.html', () => {
  it('lee el tema de la misma clave donde la app guarda los ajustes', () => {
    expect(indexHtml).toContain(`localStorage.getItem('${SETTINGS_STORAGE_KEY}')`)
  })
})
