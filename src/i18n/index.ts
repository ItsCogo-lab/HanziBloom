import { en, type MessageKey } from './en.ts'
import { es } from './es.ts'

export type { MessageKey }

export type UiLocale = 'en' | 'es'

const messages: Record<UiLocale, Record<MessageKey, string>> = { en, es }

/**
 * Idioma activo de la interfaz. De momento es fijo; cuando haya selector de
 * idioma en Ajustes, este valor vendrá de las preferencias del usuario.
 */
export const ACTIVE_UI_LOCALE: UiLocale = 'en'

/** Devuelve el texto de la interfaz para una clave en el idioma activo. */
export function t(key: MessageKey): string {
  return messages[ACTIVE_UI_LOCALE][key]
}
