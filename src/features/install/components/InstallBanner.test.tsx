import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isInstallPromptDismissed } from '../install.ts'
import { listenForInstallPrompt } from '../nativeInstallPrompt.ts'
import { InstallBanner } from './InstallBanner.tsx'

/** Imita el evento que lanza Chrome cuando la app se puede instalar. */
function fireInstallPrompt(outcome: 'accepted' | 'dismissed') {
  const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
    prompt: vi.fn(async () => {}),
    userChoice: Promise.resolve({ outcome }),
  })
  act(() => {
    window.dispatchEvent(event)
  })
  return event
}

function renderBanner(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <InstallBanner />
    </MemoryRouter>,
  )
}

let stopListening: () => void
beforeEach(() => {
  stopListening = listenForInstallPrompt()
})
afterEach(() => stopListening())

describe('InstallBanner', () => {
  it('no sale si el navegador no ofrece instalar', () => {
    renderBanner()
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
  })

  it('abre el diálogo del navegador al pulsar Install', async () => {
    const user = userEvent.setup()
    renderBanner()
    const event = fireInstallPrompt('accepted')

    expect(event.defaultPrevented).toBe(true)
    await user.click(screen.getByRole('button', { name: 'Install' }))

    expect(event.prompt).toHaveBeenCalledOnce()
    // Cada evento solo sirve una vez: el aviso desaparece
    expect(screen.queryByRole('complementary', { name: 'Install HanziVocab' })).not.toBeInTheDocument()
  })

  it('no vuelve a salir una vez cerrado', async () => {
    const user = userEvent.setup()
    renderBanner()
    fireInstallPrompt('accepted')

    await user.click(screen.getByRole('button', { name: 'Not now' }))

    expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
    expect(isInstallPromptDismissed()).toBe(true)
  })

  it('en iPhone explica cómo añadirla desde Safari', async () => {
    vi.stubGlobal('navigator', { ...navigator, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)' })
    renderBanner()

    expect(screen.getByRole('complementary', { name: 'Install HanziVocab' })).toBeInTheDocument()
    expect(screen.getByText('Choose "Add to Home Screen".')).toBeInTheDocument()
  })

  it('no tapa los botones durante una sesión', () => {
    renderBanner('/study/practice?set=hsk-1&mode=learn')
    fireInstallPrompt('accepted')
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
  })
})
