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

/**
 * Cómo se formó un carácter (Make Me a Hanzi). En los pictofonéticos, el
 * componente semántico aporta el significado y el fonético, la pronunciación:
 * 柠 = 木 (árbol) + 宁 (níng).
 */
export interface Etymology {
  type: 'pictographic' | 'ideographic' | 'pictophonetic'
  /** Pista breve en inglés: "tree" en 柠, o la explicación en los pictográficos. */
  hint?: string
  semantic?: string
  phonetic?: string
}

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
  /**
   * Descomposición en componentes como secuencia IDS de Unicode (Make Me a
   * Hanzi): 柠 → "⿰木宁" (木 a la izquierda, 宁 a la derecha).
   */
  decomposition?: string
  etymology?: Etymology
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

/**
 * Una frase de ejemplo de Tatoeba con su traducción al inglés. Se guardan
 * los ids y autores de las dos frases para poder atribuirlas y enlazarlas.
 */
export interface ExampleSentence {
  tatoebaId: number
  zh: string
  /** Usuario de Tatoeba que escribió la frase en chino. */
  author: string
  en: string
  translationTatoebaId: number
  /** Autor de la traducción; algunas traducciones antiguas no tienen (huérfanas). */
  translationAuthor?: string
  /** Palabras del dataset para las que se eligió la frase como ejemplo. */
  words: string[]
}

/** Archivo de ejemplos de un nivel (public/examples/hsk1.json). */
export interface ExampleSet {
  source: 'Tatoeba'
  /** Todas las frases de Tatoeba tienen esta licencia (algunas, además, CC0). */
  license: 'CC BY 2.0 FR'
  /** Fecha de la exportación de Tatoeba usada, "2026-09-26". */
  exportDate: string
  sentences: ExampleSentence[]
}
