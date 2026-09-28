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
  /** Número total de trazos (Unihan kTotalStrokes). */
  strokeCount?: number
  /** Radical Kangxi como carácter normal: 木, o su forma simplificada: 讠 (Unihan kRSUnicode). */
  radical?: string
  /** Número del radical Kangxi, del 1 al 214: 木 → 75 (Unihan kRSUnicode). */
  radicalNumber?: number
  /** Posición en una lista de frecuencia (1 = el más frecuente). */
  frequencyRank?: number
  /**
   * Formas tradicionales (Unihan kTraditionalVariant): 柠 → ["檸"]. Puede
   * incluir el propio carácter si también se usa en tradicional.
   */
  traditional?: string[]
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
  /** Forma tradicional de la palabra (CC-CEDICT): 柠檬 → "檸檬". */
  traditional?: string
  /** Posición en una lista de frecuencia (1 = la más frecuente). */
  frequencyRank?: number
}
