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

/**
 * Devuelve el texto de la interfaz para una clave en el idioma activo.
 * Los huecos entre llaves se rellenan con `params`:
 * t('practice.progress', { current: 3, total: 10 }) → "Card 3 of 10".
 */
export function t(key: MessageKey, params: Record<string, string | number> = {}): string {
  return messages[ACTIVE_UI_LOCALE][key].replace(/\{(\w+)\}/g, (placeholder, name: string) =>
    name in params ? String(params[name]) : placeholder,
  )
}
