import { es, type MessageKey } from './es.ts'

export type { MessageKey }

/**
 * Devuelve el texto de la interfaz para una clave.
 *
 * De momento solo hay español. Para añadir otro idioma bastará con crear
 * su archivo (p. ej. `en.ts` con tipo `Record<MessageKey, string>`) y elegir
 * aquí el diccionario según el idioma activo, sin tocar los componentes.
 */
export function t(key: MessageKey): string {
  return es[key]
}
