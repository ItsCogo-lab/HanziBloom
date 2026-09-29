import { readJson, writeJson, type KeyValueStorage } from '../../lib/storage.ts'

/**
 * Cómo se puede instalar la app en este navegador:
 * - `native`: el navegador ofrece su propio diálogo (Chrome, Edge, Samsung Internet).
 * - `ios`: en iPhone y iPad no hay diálogo; hay que explicar «Compartir → Añadir a pantalla de inicio».
 */
export type InstallMode = 'native' | 'ios'

type InstallContext = {
  /** La app ya está abierta como app instalada (sin barra del navegador). */
  standalone: boolean
  ios: boolean
  /** El navegador nos ha dado su diálogo de instalación (evento `beforeinstallprompt`). */
  hasNativePrompt: boolean
}

/** `undefined`: no hay nada que ofrecer (ya instalada, o el navegador no sabe instalar webs). */
export function getInstallMode({ standalone, ios, hasNativePrompt }: InstallContext): InstallMode | undefined {
  if (standalone) return undefined
  if (hasNativePrompt) return 'native'
  if (ios) return 'ios'
  return undefined
}

/** iPhone, iPod o iPad. Los iPad modernos dicen ser un Mac, pero un Mac no tiene pantalla táctil. */
export function isIos({ userAgent, maxTouchPoints }: Pick<Navigator, 'userAgent' | 'maxTouchPoints'>): boolean {
  return /iPhone|iPad|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && maxTouchPoints > 1)
}

/** La app se está usando instalada: Android/escritorio usan display-mode, Safari su propia propiedad. */
export function isStandalone(): boolean {
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true
  // jsdom (los tests) no tiene matchMedia
  return iosStandalone || window.matchMedia?.('(display-mode: standalone)').matches === true
}

const STORAGE_KEY = 'hanzivocab.installPromptDismissed'

/** El aviso de instalar solo se cierra una vez: después ya no vuelve a salir. */
export function isInstallPromptDismissed(storage?: KeyValueStorage): boolean {
  return readJson(STORAGE_KEY, storage) === true
}

export function dismissInstallPrompt(storage?: KeyValueStorage): void {
  writeJson(STORAGE_KEY, true, storage)
}
