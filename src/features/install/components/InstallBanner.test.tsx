import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isInstallPromptDismissed } from '../install.ts'
import { listenForInstallPrompt } from '../nativeInstallPrompt.ts'
import { InstallBanner } from './InstallBanner.tsx'

/** Mimics the event Chrome fires when the app can be installed. */
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
  it("doesn't show if the browser doesn't offer installation", () => {
    renderBanner()
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
  })

  it('opens the browser dialog when Install is clicked', async () => {
    const user = userEvent.setup()
    renderBanner()
    const event = fireInstallPrompt('accepted')

    expect(event.defaultPrevented).toBe(true)
    await user.click(screen.getByRole('button', { name: 'Install' }))

    expect(event.prompt).toHaveBeenCalledOnce()
    // Each event can only be used once: the banner disappears
    expect(screen.queryByRole('complementary', { name: 'Install VividHanzi' })).not.toBeInTheDocument()
  })

  it("doesn't show again once dismissed", async () => {
    const user = userEvent.setup()
    renderBanner()
    fireInstallPrompt('accepted')

    await user.click(screen.getByRole('button', { name: 'Not now' }))

    expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
    expect(isInstallPromptDismissed()).toBe(true)
  })

  it('on iPhone explains how to add it from Safari', async () => {
    vi.stubGlobal('navigator', { ...navigator, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)' })
    renderBanner()

    expect(screen.getByRole('complementary', { name: 'Install VividHanzi' })).toBeInTheDocument()
    expect(screen.getByText('Choose "Add to Home Screen".')).toBeInTheDocument()
  })

  it("doesn't cover the buttons during a session", () => {
    renderBanner('/study/practice?set=hsk-1&mode=learn')
    fireInstallPrompt('accepted')
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
  })
})
