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
  /** Cómo se puede instalar aquí; `undefined` si no se puede o ya está instalada. */
  mode: InstallMode | undefined
  /** La persona ya cerró el aviso (Ajustes sigue ofreciendo instalar). */
  dismissed: boolean
  /** Abre el diálogo nativo del navegador (solo en modo `native`). */
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
      // Si dice que no en el diálogo del navegador, no volvemos a insistir
      if (!accepted) dismiss()
    },
    dismiss,
  }
}
