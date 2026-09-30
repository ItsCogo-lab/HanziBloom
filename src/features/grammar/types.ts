/** A Tatoeba example sentence, copied verbatim from public/examples/ (a test checks this). */
export interface GrammarExample {
  tatoebaId: number
  zh: string
  en: string
  /** Author of the Chinese sentence on Tatoeba: its license requires attribution. */
  author: string
}

/**
 * A grammatical use of a function word (a particle like 了, a preposition
 * like 被, a conjunction like 虽然): 了 has two (completed action and change
 * of state), 被 has one.
 */
export interface GrammarPoint {
  id: string
  /** The word, as written: "的", "虽然". */
  word: string
  /** Its pinyin in this use, without tones: "de", "sui ran". */
  pinyin: string
  /**
   * Other words whose entries also show this point, whatever their reading:
   * 但是 for 虽然...但是.
   */
  alsoShownOn?: readonly string[]
  title: string
  /** Sentence pattern: "Verb + 过 + Object". */
  pattern: string
  /** Original English explanation (not copied from the Grammar Wiki, see DATA_SOURCES.md). */
  explanation: string
  examples: readonly GrammarExample[]
  /** Chinese Grammar Wiki page on this point, for further reading. */
  reference: { title: string; url: string }
}
