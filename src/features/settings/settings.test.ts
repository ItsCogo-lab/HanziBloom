import { describe, expect, it } from 'vitest'
import { memoryStorage } from '../../test/memoryStorage.ts'
import { DEFAULT_SETTINGS, isSessionSize, loadSettings, saveSettings } from './settings.ts'

describe('saveSettings / loadSettings', () => {
  it('guarda y recupera los ajustes', () => {
    const storage = memoryStorage()
    const settings = { sessionSize: 20, toneColors: false, toneNumbers: true, theme: 'dark', hskLevel: 3 } as const
    saveSettings(settings, storage)

    expect(loadSettings(storage)).toEqual(settings)
  })

  it('sin ajustes guardados usa los de por defecto', () => {
    expect(loadSettings(memoryStorage())).toEqual(DEFAULT_SETTINGS)
  })

  it('los ajustes guardados antes de existir los tonos toman los valores por defecto', () => {
    const storage = memoryStorage({ 'hanzivocab.settings': JSON.stringify({ version: 1, sessionSize: 5 }) })
    expect(loadSettings(storage)).toEqual({ sessionSize: 5, toneColors: true, toneNumbers: false, theme: 'system', hskLevel: null })
  })

  it('ignora valores no válidos', () => {
    const storage = memoryStorage({ 'hanzivocab.settings': JSON.stringify({ version: 1, sessionSize: 7, theme: 'sepia', hskLevel: 6 }) })
    expect(loadSettings(storage)).toEqual(DEFAULT_SETTINGS)
  })
})

describe('isSessionSize', () => {
  it('solo acepta las opciones disponibles', () => {
    expect(isSessionSize(5)).toBe(true)
    expect(isSessionSize(7)).toBe(false)
    expect(isSessionSize('10')).toBe(false)
  })
})
