import { afterEach, describe, expect, it, vi } from 'vitest'
import indexHtml from '../../../index.html?raw'
import { SETTINGS_STORAGE_KEY } from './settings.ts'
import { applyTheme, isThemePreference, resolveTheme, systemPrefersDark } from './theme.ts'

afterEach(() => {
  delete document.documentElement.dataset.theme
  document.head.replaceChildren()
})

describe('resolveTheme', () => {
  it('with "system" follows the device', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
  })

  it('an explicit choice overrides the device', () => {
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
  })
})

describe('isThemePreference', () => {
  it('only accepts the available options', () => {
    expect(isThemePreference('dark')).toBe(true)
    expect(isThemePreference('sepia')).toBe(false)
    expect(isThemePreference(undefined)).toBe(false)
  })
})

describe('systemPrefersDark', () => {
  it('reads the device preference', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query === '(prefers-color-scheme: dark)' }))
    expect(systemPrefersDark()).toBe(true)
  })

  it('assumes light theme without matchMedia', () => {
    vi.stubGlobal('matchMedia', undefined)
    expect(systemPrefersDark()).toBe(false)
  })
})

describe('applyTheme', () => {
  it('sets the theme on <html> and paints the browser bar with the background', () => {
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
  it('reads the theme from the same key where the app saves settings', () => {
    expect(indexHtml).toContain(`localStorage.getItem('${SETTINGS_STORAGE_KEY}')`)
  })
})
