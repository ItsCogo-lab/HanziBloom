import { useState, useSyncExternalStore } from 'react'
import {
  dismissInstallPrompt,
  getInstallMode,
  isInstallPromptDismissed,
  isIos,
  isStandalone,
  type InstallMode,
} from './install.ts'
import { getInstallPrompt, showInstallPrompt, subscribeToInstallPrompt } from './nativeInstallPrompt.ts'

export type InstallPromptState = {
  /** How it can be installed here; `undefined` if it can't or is already installed. */
  mode: InstallMode | undefined
  /** The person already dismissed the banner (Settings still offers installation). */
  dismissed: boolean
  /** Opens the browser's native dialog (only in `native` mode). */
  install: () => Promise<void>
  dismiss: () => void
}

export function useInstallPrompt(): InstallPromptState {
  const nativePrompt = useSyncExternalStore(subscribeToInstallPrompt, getInstallPrompt)
  const [dismissed, setDismissed] = useState(() => isInstallPromptDismissed())

  const dismiss = () => {
    dismissInstallPrompt()
    setDismissed(true)
  }

  return {
    mode: getInstallMode({ standalone: isStandalone(), ios: isIos(navigator), hasNativePrompt: nativePrompt !== undefined }),
    dismissed,
    install: async () => {
      const accepted = await showInstallPrompt()
      // If they say no in the browser dialog, we don't ask again
      if (!accepted) dismiss()
    },
    dismiss,
  }
}
