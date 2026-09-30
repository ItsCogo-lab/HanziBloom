import type { Tone } from '../../lib/tones.ts'
import type { StudyItemId } from '../dictionary/studyItem.ts'

/**
 * A set created by the user, as it is saved. It only stores dictionary item
 * ids: it never copies or changes hanzi, pinyin or meanings, which still come
 * from the dataset. It is plain JSON, so it can be exported or sent to a
 * server later without changing it.
 */
export interface CustomSet {
  /** "custom-" + a random id; unique among all sets. */
  id: string
  name: string
  /** Optional: may be empty. */
  description: string
  itemIds: StudyItemId[]
  /**
   * The user's own meanings for items in this set. They are the user's notes:
   * the dictionary meaning does not change, and the same item in another set
   * has its own notes.
   */
  meanings: Partial<Record<StudyItemId, string>>
  /** The user's example sentences. Like the meanings, they only exist in this set. */
  sentences: CustomSentence[]
  /** ISO 8601 dates. */
  createdAt: string
  updatedAt: string
}

export interface CustomSetDetails {
  name: string
  description: string
}

/**
 * A token of a sentence: a Chinese character with its reading, or non-Chinese
 * text (punctuation, spaces, letters), which is shown as is and without tone.
 */
export interface SentenceToken {
  text: string
  /** Only on Chinese characters: the syllable with a tone mark ("píng"). */
  pinyin?: string
  /** The tone of that syllable; missing if it cannot be known. */
  tone?: Tone
  /**
   * The pinyin engine cannot be sure of the reading in this context (a
   * character with several readings outside a known word). It is shown
   * marked and without color until the user picks among `candidates`.
   */
  uncertain?: boolean
  /** Possible readings of the character, for the user to pick from. */
  candidates?: string[]
}

/**
 * A user sentence. The user only writes the Chinese; the pinyin and tones are
 * generated and saved separately (in `tokens`), so displaying it does not
 * depend on the engine.
 */
export interface CustomSentence {
  /** "sentence-" + a random id. */
  id: string
  /** The set item it belongs to; if missing, it is a sentence of the whole set. */
  itemId?: StudyItemId
  chinese: string
  tokens: SentenceToken[]
  createdAt: string
  updatedAt: string
}
