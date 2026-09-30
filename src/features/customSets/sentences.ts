import { getSyllableTone } from '../../lib/tones.ts'
import type { StudyItemId } from '../dictionary/studyItem.ts'
import type { CustomSentence, CustomSet, SentenceToken } from './types.ts'

export const MAX_SENTENCE_LENGTH = 120

const HAN = /\p{Script=Han}/u

export function isChineseCharacter(character: string): boolean {
  return HAN.test(character)
}

export type SentenceProblem = 'emptySentence' | 'noChinese' | 'sentenceTooLong'

/** The sentence, already cleaned up, or the problem with it. It must have at least one Chinese character. */
export function validateSentence(chinese: string): { chinese: string } | { problem: SentenceProblem } {
  const trimmed = chinese.trim()
  if (trimmed === '') return { problem: 'emptySentence' }
  if ([...trimmed].length > MAX_SENTENCE_LENGTH) return { problem: 'sentenceTooLong' }
  if (!HAN.test(trimmed)) return { problem: 'noChinese' }
  return { chinese: trimmed }
}

/**
 * Splits a sentence into tokens: each Chinese character separately and the
 * rest (punctuation, spaces, letters) in text chunks as is. Joining the
 * `text` values always gives back the original sentence.
 */
export function splitSentence(chinese: string): SentenceToken[] {
  const tokens: SentenceToken[] = []
  for (const character of chinese) {
    const last = tokens.at(-1)
    if (isChineseCharacter(character)) tokens.push({ text: character })
    else if (last && !isChineseCharacter(last.text)) last.text += character
    else tokens.push({ text: character })
  }
  return tokens
}

export function createSentenceId(): string {
  return `sentence-${crypto.randomUUID()}`
}

export function createSentence(
  input: { chinese: string; tokens: SentenceToken[]; itemId?: StudyItemId },
  id: string,
  now: Date,
): CustomSentence {
  const date = now.toISOString()
  return { id, ...input, createdAt: date, updatedAt: date }
}

/** Adds a sentence to the set. A repeated id is not added (ids are unique). */
export function addSentence(set: CustomSet, sentence: CustomSentence): CustomSet {
  if (set.sentences.some((other) => other.id === sentence.id)) return set
  if (sentence.itemId !== undefined && !set.itemIds.includes(sentence.itemId)) return set
  return { ...set, sentences: [...set.sentences, sentence] }
}

export function updateSentence(
  set: CustomSet,
  sentenceId: string,
  now: Date,
  change: Pick<CustomSentence, 'chinese' | 'tokens'>,
): CustomSet {
  return {
    ...set,
    sentences: set.sentences.map((sentence) =>
      sentence.id === sentenceId ? { ...sentence, ...change, updatedAt: now.toISOString() } : sentence,
    ),
  }
}

export function deleteSentence(set: CustomSet, sentenceId: string): CustomSet {
  return { ...set, sentences: set.sentences.filter((sentence) => sentence.id !== sentenceId) }
}

/** The sentences attached to a set item. */
export function getItemSentences(set: CustomSet, itemId: StudyItemId): CustomSentence[] {
  return set.sentences.filter((sentence) => sentence.itemId === itemId)
}

/** The user picks the reading of an uncertain character among the possible ones: it is no longer uncertain. */
export function chooseReading(tokens: readonly SentenceToken[], index: number, reading: string): SentenceToken[] {
  return tokens.map((token, i) => {
    if (i !== index || !token.uncertain || !token.candidates?.includes(reading)) return token
    const tone = getSyllableTone(reading)
    return { text: token.text, pinyin: reading, ...(tone === undefined ? {} : { tone }) }
  })
}

/** How many characters of the sentence have an unconfirmed reading. */
export function countUncertain(tokens: readonly SentenceToken[]): number {
  return tokens.filter((token) => token.uncertain).length
}
