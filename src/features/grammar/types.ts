/** A Tatoeba example sentence, copied verbatim from public/examples/ (a test checks this). */
export interface GrammarExample {
  tatoebaId: number
  zh: string
  en: string
  /** Author of the Chinese sentence on Tatoeba: its license requires attribution. */
  author: string
}

/**
 * A grammatical use of a particle: 了 has two (completed action and
 * change of state), 吗 has one.
 */
export interface GrammarPoint {
  id: string
  /** The particle, as written: "的". */
  particle: string
  /** Its pinyin as a particle, without tone (they are unstressed): "de". */
  pinyin: string
  title: string
  /** Sentence pattern: "Verb + 过 + Object". */
  pattern: string
  /** Original English explanation (not copied from the Grammar Wiki, see DATA_SOURCES.md). */
  explanation: string
  examples: readonly GrammarExample[]
  /** Chinese Grammar Wiki page on this point, for further reading. */
  reference: { title: string; url: string }
}
