import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { createEmptyProgress, recordAnswer } from '../features/progress/progress.ts'
import { loadProgress, saveProgress } from '../features/progress/storage.ts'
import { loadSettings } from '../features/settings/settings.ts'
import { memoryStorage } from '../test/memoryStorage.ts'
import { renderWithProviders } from '../test/renderWithProviders.tsx'
import { SettingsPage } from './SettingsPage.tsx'

describe('SettingsPage', () => {
  it('cambia y guarda el número de ejercicios por sesión', async () => {
    const user = userEvent.setup()
    const storage = memoryStorage()
    renderWithProviders(<SettingsPage />, { storage })

    expect(screen.getByRole('radio', { name: '10' })).toBeChecked()
    await user.click(screen.getByRole('radio', { name: '20' }))

    expect(screen.getByRole('radio', { name: '20' })).toBeChecked()
    expect(loadSettings(storage).sessionSize).toBe(20)
  })

  it('borra el progreso solo después de confirmar', async () => {
    const user = userEvent.setup()
    const storage = memoryStorage()
    saveProgress(recordAnswer(createEmptyProgress(), 'char:你', true, new Date()), storage)
    renderWithProviders(<SettingsPage />, { storage })

    await user.click(screen.getByRole('button', { name: 'Delete progress' }))
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(loadProgress(storage).items['char:你']).toBeDefined()

    await user.click(screen.getByRole('button', { name: 'Delete progress' }))
    await user.click(screen.getByRole('button', { name: 'Yes, delete everything' }))

    expect(loadProgress(storage)).toEqual(createEmptyProgress())
    expect(screen.getByRole('status')).toHaveTextContent('Your progress has been deleted.')
  })

  it('cita las fuentes del dataset y sus licencias', () => {
    renderWithProviders(<SettingsPage />)

    expect(screen.getByRole('link', { name: 'CC-CEDICT' })).toHaveAttribute('href', 'https://cc-cedict.org/wiki/')
    for (const source of ['Unicode Unihan', 'Make Me a Hanzi', 'Hanzi Writer data', 'Tatoeba']) {
      expect(screen.getByRole('link', { name: source })).toBeInTheDocument()
    }
    expect(screen.getByText(/CC BY-SA 4\.0\)/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'clem109/hsk-vocabulary' })).toBeInTheDocument()
  })
})
