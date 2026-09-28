/** Niveles HSK que cubrirá la app (estándar HSK 2.0). */
export type HskLevel = 1 | 2 | 3 | 4

/** Idiomas en los que puede estar el contenido educativo (significados). */
export type ContentLocale = 'es' | 'en' | 'ca'

/**
 * Significados de una entrada por idioma. El inglés es obligatorio porque
 * es el idioma de la fuente (CC-CEDICT); español y catalán se podrán añadir
 * más adelante sin cambiar el modelo.
 */
export type Translations = { en: string[] } & Partial<Record<Exclude<ContentLocale, 'en'>, string[]>>

/** Un carácter chino (hanzi) individual. */
export interface Character {
  /** Identificador único: el propio carácter, p. ej. "好". */
  id: string
  hanzi: string
  /** Pinyin con marcas de tono. Algunos caracteres tienen varias lecturas (了: le, liǎo). */
  pinyin: string[]
  meanings: Translations
  hskLevel: HskLevel
  /*
   * Opcionales a propósito: solo se rellenan si tenemos una fuente fiable.
   * Mejor un dato vacío que un dato inventado.
   */
  strokeCount?: number
  radical?: string
  /** Posición en una lista de frecuencia (1 = el más frecuente). */
  frequencyRank?: number
}

/** Una palabra del vocabulario, formada por uno o más caracteres. */
export interface Word {
  /** Identificador único: la propia palabra, p. ej. "你好". */
  id: string
  hanzi: string
  /** Pinyin de la palabra completa con marcas de tono, p. ej. "nǐ hǎo". */
  pinyin: string
  meanings: Translations
  hskLevel: HskLevel
}
