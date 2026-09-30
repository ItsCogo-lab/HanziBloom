import { readJson, writeJson, type KeyValueStorage } from '../../lib/storage.ts'

/**
 * How the app can be installed in this browser:
 * - `native`: the browser offers its own dialog (Chrome, Edge, Samsung Internet).
 * - `ios`: iPhone and iPad have no dialog; we have to explain "Share → Add to Home Screen".
 */
export type InstallMode = 'native' | 'ios'

type InstallContext = {
  /** The app is already open as an installed app (no browser bar). */
  standalone: boolean
  ios: boolean
  /** The browser has given us its install dialog (`beforeinstallprompt` event). */
  hasNativePrompt: boolean
}

/** `undefined`: nothing to offer (already installed, or the browser can't install web apps). */
export function getInstallMode({ standalone, ios, hasNativePrompt }: InstallContext): InstallMode | undefined {
  if (standalone) return undefined
  if (hasNativePrompt) return 'native'
  if (ios) return 'ios'
  return undefined
}

/** iPhone, iPod or iPad. Modern iPads claim to be a Mac, but a Mac has no touchscreen. */
export function isIos({ userAgent, maxTouchPoints }: Pick<Navigator, 'userAgent' | 'maxTouchPoints'>): boolean {
  return /iPhone|iPad|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && maxTouchPoints > 1)
}

/** The app is being used installed: Android/desktop use display-mode, Safari its own property. */
export function isStandalone(): boolean {
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true
  // jsdom (tests) has no matchMedia
  return iosStandalone || window.matchMedia?.('(display-mode: standalone)').matches === true
}

const STORAGE_KEY = 'hanzivocab.installPromptDismissed'

/** The install banner is dismissed only once: after that it never shows again. */
export function isInstallPromptDismissed(storage?: KeyValueStorage): boolean {
  return readJson(STORAGE_KEY, storage) === true
}

export function dismissInstallPrompt(storage?: KeyValueStorage): void {
  writeJson(STORAGE_KEY, true, storage)
}
