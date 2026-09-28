import { describe, expect, it } from 'vitest'
import { cmnEngLinksFixture, cmnSentencesFixture, engSentencesFixture } from '../fixtures/tatoeba.ts'
import {
  isUsableSentence,
  parseLinkLine,
  parseSentenceLine,
  selectExamples,
  type TatoebaSentence,
} from './tatoeba.ts'

function sentences(text: string): Map<number, TatoebaSentence> {
  const parsed = text.split('\n').map(parseSentenceLine)
  return new Map(parsed.filter((sentence) => sentence !== undefined).map((sentence) => [sentence.id, sentence]))
}

function links(text: string): Map<number, number[]> {
  const result = new Map<number, number[]>()
  for (const [from, to] of text.split('\n').map(parseLinkLine).filter((link) => link !== undefined)) {
    result.set(from, [...(result.get(from) ?? []), to])
  }
  return result
}

const chinese = sentences(cmnSentencesFixture)
const english = sentences(engSentencesFixture)
const translations = links(cmnEngLinksFixture)

describe('adaptador de Tatoeba', () => {
  it('lee las líneas de frases y de enlaces', () => {
    expect(chinese.get(8934441)).toEqual({ id: 8934441, text: '柠檬很酸。', author: 'iiujik' })
    expect(english.get(29487)).toEqual({ id: 29487, text: 'Lemon is sour.' })
    expect(parseLinkLine('8934441\t29487')).toEqual([8934441, 29487])
    expect(parseSentenceLine('x\tcmn\t\t\\N')).toBeUndefined()
  })

  it('solo acepta frases cortas con caracteres conocidos y sin letras latinas', () => {
    const known = new Set(Array.from('柠檬很酸'))
    expect(isUsableSentence('柠檬很酸。', known)).toBe(true)
    expect(isUsableSentence('柠檬很酸，很好。', known)).toBe(false)
    expect(isUsableSentence('Tom很酸。', known)).toBe(false)
  })

  it('elige para 柠檬 la frase de Tatoeba con su traducción y atribución', () => {
    const examples = selectExamples({
      words: ['柠檬'],
      knownCharacters: new Set(Array.from('柠檬很酸')),
      chinese,
      english,
      translations,
    })
    expect(examples).toEqual([
      {
        tatoebaId: 8934441,
        zh: '柠檬很酸。',
        author: 'iiujik',
        en: 'Lemon is sour.',
        translationTatoebaId: 29487,
        words: ['柠檬'],
      },
    ])
  })

  it('reúne en una frase todas las palabras para las que se eligió', () => {
    const examples = selectExamples({
      words: ['谢谢', '你'],
      knownCharacters: new Set(Array.from('谢你')),
      chinese,
      english,
      translations,
    })
    expect(examples.map(({ tatoebaId, en, words }) => ({ tatoebaId, en, words }))).toEqual([
      { tatoebaId: 374825, en: 'Thank you!', words: ['谢谢', '你'] },
    ])
  })

  it('no usa frases chinas huérfanas', () => {
    const examples = selectExamples({
      words: ['你们'],
      knownCharacters: new Set(Array.from('你们好吗')),
      chinese,
      english,
      translations,
    })
    expect(examples).toEqual([])
  })
})
