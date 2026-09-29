/** Una frase de ejemplo de Tatoeba, copiada tal cual de public/examples/ (un test lo comprueba). */
export interface GrammarExample {
  tatoebaId: number
  zh: string
  en: string
  /** Autor de la frase china en Tatoeba: su licencia pide citarlo. */
  author: string
}

/**
 * Un uso gramatical de una partícula: 了 tiene dos (acción terminada y
 * cambio de estado), 吗 uno.
 */
export interface GrammarPoint {
  id: string
  /** La partícula, tal como se escribe: "的". */
  particle: string
  /** Su pinyin como partícula, sin tono (son átonas): "de". */
  pinyin: string
  title: string
  /** Estructura de la frase: "Verb + 过 + Object". */
  pattern: string
  /** Explicación original en inglés (no copiada de la Grammar Wiki, ver DATA_SOURCES.md). */
  explanation: string
  examples: readonly GrammarExample[]
  /** Página de la Chinese Grammar Wiki sobre este punto, para ampliar. */
  reference: { title: string; url: string }
}
