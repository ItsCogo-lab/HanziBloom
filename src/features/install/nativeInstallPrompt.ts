/**
 * The browser's install dialog (Chrome, Edge, Samsung Internet).
 *
 * The browser fires `beforeinstallprompt` only once, often before React
 * mounts the app. That's why we listen for it from main.tsx and store it
 * here, and components read it with useInstallPrompt().
 */

/** Not in the TypeScript types because it's non-standard (Safari and Firefox don't have it). */
export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let savedPrompt: BeforeInstallPromptEvent | undefined
const listeners = new Set<() => void>()

function setSavedPrompt(prompt: BeforeInstallPromptEvent | undefined) {
  savedPrompt = prompt
  listeners.forEach((listener) => listener())
}

/** Starts listening for install events. Returns a function to stop. */
export function listenForInstallPrompt(target: Window = window): () => void {
  const onPrompt = (event: Event) => {
    // Without this, Chrome shows its own bar; we prefer to show the prompt ourselves
    event.preventDefault()
    setSavedPrompt(event as BeforeInstallPromptEvent)
  }
  const onInstalled = () => setSavedPrompt(undefined)
  target.addEventListener('beforeinstallprompt', onPrompt)
  target.addEventListener('appinstalled', onInstalled)
  return () => {
    target.removeEventListener('beforeinstallprompt', onPrompt)
    target.removeEventListener('appinstalled', onInstalled)
    setSavedPrompt(undefined)
  }
}

export function subscribeToInstallPrompt(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getInstallPrompt(): BeforeInstallPromptEvent | undefined {
  return savedPrompt
}

/**
 * Opens the browser dialog. Each event can only be used once, so it is
 * discarded afterwards. Returns whether the person accepted the install.
 */
export async function showInstallPrompt(): Promise<boolean> {
  const prompt = savedPrompt
  if (!prompt) return false
  setSavedPrompt(undefined)
  await prompt.prompt()
  const { outcome } = await prompt.userChoice
  return outcome === 'accepted'
}
