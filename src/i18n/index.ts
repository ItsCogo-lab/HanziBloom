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

/** Porcentaje en el formato del idioma activo: 0.75 → "75%". */
export function formatPercent(ratio: number): string {
  return new Intl.NumberFormat(ACTIVE_UI_LOCALE, { style: 'percent' }).format(ratio)
}

/** Día corto en el idioma activo: "Mon 28". */
export function formatShortDay(date: Date): string {
  return new Intl.DateTimeFormat(ACTIVE_UI_LOCALE, { weekday: 'short', day: 'numeric' }).format(date)
}

/** Fecha en formato medio del idioma activo: "Sep 28, 2026". */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat(ACTIVE_UI_LOCALE, { dateStyle: 'medium' }).format(date)
}
