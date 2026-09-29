/**
 * El diálogo de instalación del navegador (Chrome, Edge, Samsung Internet).
 *
 * El navegador lanza `beforeinstallprompt` una sola vez, a menudo antes de que
 * React monte la app. Por eso lo escuchamos desde main.tsx y lo guardamos
 * aquí, y los componentes lo leen con useNativeInstallPrompt().
 */

/** No está en los tipos de TypeScript porque no es estándar (Safari y Firefox no lo tienen). */
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

/** Empieza a escuchar los eventos de instalación. Devuelve una función para dejar de hacerlo. */
export function listenForInstallPrompt(target: Window = window): () => void {
  const onPrompt = (event: Event) => {
    // Sin esto, Chrome enseña su propia barra; preferimos mostrar el aviso nosotros
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
 * Abre el diálogo del navegador. Cada evento solo sirve una vez, así que se
 * descarta después. Devuelve si la persona ha aceptado instalar.
 */
export async function showInstallPrompt(): Promise<boolean> {
  const prompt = savedPrompt
  if (!prompt) return false
  setSavedPrompt(undefined)
  await prompt.prompt()
  const { outcome } = await prompt.userChoice
  return outcome === 'accepted'
}
