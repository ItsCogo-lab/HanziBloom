import { describe, expect, it } from 'vitest'
import hsk1Examples from '../../../public/examples/hsk1.json'
import hsk2Examples from '../../../public/examples/hsk2.json'
import hsk3Examples from '../../../public/examples/hsk3.json'
import hsk4Examples from '../../../public/examples/hsk4.json'
import { grammarPoints } from '../../data/grammar.ts'
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
  it('gives every use of the particle on the character entry, whatever its reading', () => {
    expect(ids(getGrammarPoints({ kind: 'character', entry: character('了', ['le', 'liǎo']) }))).toEqual([
      'le-completion',
      'le-change',
    ])
    expect(ids(getGrammarPoints({ kind: 'character', entry: character('得', ['de', 'děi', 'dé']) }))).toEqual([
      'de-degree',
    ])
  })

  it('on a word, only if it is read as the particle (ignoring tone)', () => {
    expect(ids(getGrammarPoints({ kind: 'word', entry: word('得', 'de') }))).toEqual(['de-degree'])
    expect(getGrammarPoints({ kind: 'word', entry: word('得', 'děi') })).toEqual([])
    expect(getGrammarPoints({ kind: 'word', entry: word('地', 'dì') })).toEqual([])
    expect(ids(getGrammarPoints({ kind: 'word', entry: word('过', 'guò') }))).toEqual(['guo-experience'])
  })

  it("gives nothing for entries that aren't particles", () => {
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
      expect(point.pattern).toContain(point.particle)
      expect(point.examples.length).toBeGreaterThan(0)
    }
  })

  it('use Tatoeba sentences copied verbatim from public/examples/ that contain the particle', () => {
    for (const point of grammarPoints) {
      for (const example of point.examples) {
        const source = tatoeba.get(example.tatoebaId)
        expect(source, `Tatoeba #${example.tatoebaId}`).toBeDefined()
        expect(example).toEqual({ tatoebaId: source!.tatoebaId, zh: source!.zh, en: source!.en, author: source!.author })
        expect(example.zh).toContain(point.particle)
      }
    }
  })
})
