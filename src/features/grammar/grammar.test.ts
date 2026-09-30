import { describe, expect, it } from 'vitest'
import hsk1Examples from '../../../public/examples/hsk1.json'
import hsk2Examples from '../../../public/examples/hsk2.json'
import hsk3Examples from '../../../public/examples/hsk3.json'
import hsk4Examples from '../../../public/examples/hsk4.json'
import { grammarPoints } from '../../data/grammar.ts'
import { allWords } from '../../data/index.ts'
import type { Character, Word } from '../dictionary/types.ts'
import { getGrammarPoints } from './grammar.ts'

function character(hanzi: string, pinyin: string[]): Character {
  return { id: hanzi, hanzi, pinyin, meanings: { en: ['test'] } }
}

function word(hanzi: string, pinyin: string): Word {
  return { id: `${hanzi}[${pinyin}]`, hanzi, pinyin, meanings: { en: ['test'] } }
}

const ids = (points: { id: string }[]) => points.map((point) => point.id)

describe('getGrammarPoints', () => {
  it('gives every use of the word on the character entry, whatever its reading', () => {
    expect(ids(getGrammarPoints({ kind: 'character', entry: character('了', ['le', 'liǎo']) }))).toEqual([
      'le-completion',
      'le-change',
    ])
    expect(ids(getGrammarPoints({ kind: 'character', entry: character('得', ['de', 'děi', 'dé']) }))).toEqual([
      'de-degree',
    ])
  })

  it('on a word, only if it is read as in that use (ignoring tone)', () => {
    expect(ids(getGrammarPoints({ kind: 'word', entry: word('得', 'de') }))).toEqual(['de-degree'])
    expect(getGrammarPoints({ kind: 'word', entry: word('得', 'děi') })).toEqual([])
    expect(getGrammarPoints({ kind: 'word', entry: word('地', 'dì') })).toEqual([])
    expect(ids(getGrammarPoints({ kind: 'word', entry: word('过', 'guò') }))).toEqual(['guo-experience'])
  })

  it('also shows a point on the words in alsoShownOn, like 但是 for 虽然...但是', () => {
    expect(ids(getGrammarPoints({ kind: 'word', entry: word('虽然', 'suī rán') }))).toEqual(['suiran-danshi'])
    expect(ids(getGrammarPoints({ kind: 'word', entry: word('但是', 'dàn shì') }))).toEqual(['suiran-danshi'])
    expect(ids(getGrammarPoints({ kind: 'word', entry: word('正在', 'zhèng zài') }))).toEqual(['zai-progressive'])
  })

  it("gives nothing for entries that aren't function words", () => {
    expect(getGrammarPoints({ kind: 'word', entry: word('的确', 'díquè') })).toEqual([])
    expect(getGrammarPoints({ kind: 'character', entry: character('好', ['hǎo']) })).toEqual([])
  })
})

describe("the app's grammar notes", () => {
  const tatoeba = new Map(
    [hsk1Examples, hsk2Examples, hsk3Examples, hsk4Examples].flatMap((set) =>
      set.sentences.map((sentence) => [sentence.tatoebaId, sentence] as const),
    ),
  )

  it('have unique ids, a Grammar Wiki link and examples', () => {
    expect(new Set(ids([...grammarPoints])).size).toBe(grammarPoints.length)
    for (const point of grammarPoints) {
      expect(point.reference.url).toMatch(/^https:\/\/resources\.allsetlearning\.com\/chinese\/grammar\/ASG\w+$/)
      expect(point.pattern).toContain(point.word)
      expect(point.examples.length).toBeGreaterThan(0)
    }
  })

  it('belong to HSK 1-4 words that are read as in that use, so every note shows up on a word', () => {
    for (const point of grammarPoints) {
      const words = allWords.filter((entry) => entry.hanzi === point.word)
      expect(ids(words.flatMap((entry) => getGrammarPoints({ kind: 'word', entry }))), point.id).toContain(point.id)
      for (const other of point.alsoShownOn ?? []) {
        expect(allWords.some((entry) => entry.hanzi === other), `${point.id}: ${other}`).toBe(true)
      }
    }
  })

  it('use Tatoeba sentences copied verbatim from public/examples/ that contain the word', () => {
    for (const point of grammarPoints) {
      for (const example of point.examples) {
        const source = tatoeba.get(example.tatoebaId)
        expect(source, `Tatoeba #${example.tatoebaId}`).toBeDefined()
        expect(example).toEqual({ tatoebaId: source!.tatoebaId, zh: source!.zh, en: source!.en, author: source!.author })
        const words = [point.word, ...(point.alsoShownOn ?? [])]
        expect(words.some((word) => example.zh.includes(word)), `Tatoeba #${example.tatoebaId}`).toBe(true)
      }
    }
  })
})
