import type { StudyItemId } from '../dictionary/studyItem.ts'
import type { CustomSentence, CustomSet, SentenceToken } from './types.ts'

export const MAX_SENTENCE_LENGTH = 120

const HAN = /\p{Script=Han}/u

export function isChineseCharacter(character: string): boolean {
  return HAN.test(character)
}

export type SentenceProblem = 'emptySentence' | 'noChinese' | 'sentenceTooLong'

/** La frase ya limpia, o el problema que tiene. Debe tener al menos un carácter chino. */
export function validateSentence(chinese: string): { chinese: string } | { problem: SentenceProblem } {
  const trimmed = chinese.trim()
  if (trimmed === '') return { problem: 'emptySentence' }
  if ([...trimmed].length > MAX_SENTENCE_LENGTH) return { problem: 'sentenceTooLong' }
  if (!HAN.test(trimmed)) return { problem: 'noChinese' }
  return { chinese: trimmed }
}

/**
 * Parte una frase en trozos: cada carácter chino por separado y el resto
 * (puntuación, espacios, letras) en trozos de texto tal cual. Unir los
 * `text` devuelve siempre la frase original.
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

/** Añade una frase al set. Un id repetido no se añade (los ids son únicos). */
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

/** Las frases que acompañan a un elemento del set. */
export function getItemSentences(set: CustomSet, itemId: StudyItemId): CustomSentence[] {
  return set.sentences.filter((sentence) => sentence.itemId === itemId)
}
