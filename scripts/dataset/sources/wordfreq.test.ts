import { describe, expect, it } from 'vitest'
import { parseWordfreq, withFrequencyRank } from './wordfreq.ts'

const tsv = ['的\t0.06', 'the\t0.01', '我们\t0.005', '你们\t0.002', '我\t0.001', '2\t0.0009', '们\t0.0001', ''].join('\n')

describe('parseWordfreq', () => {
  it('ranks words by their position, skipping entries that are not hanzi', () => {
    const { words } = parseWordfreq(tsv)

    expect(words.get('的')).toBe(1)
    expect(words.get('我们')).toBe(2)
    expect(words.get('们')).toBe(5)
    expect(words.has('the')).toBe(false)
  })

  it('ranks characters by the frequency of all the words they are in', () => {
    const { characters } = parseWordfreq(tsv)

    // 们: 0.005 + 0.002 + 0.0001, more than 我 (0.005 + 0.001)
    expect([...characters.keys()]).toEqual(['的', '们', '我', '你'])
  })

  it('stops on a malformed line instead of guessing', () => {
    expect(() => parseWordfreq('的\tabc\n')).toThrow('unexpected line')
  })
})

describe('withFrequencyRank', () => {
  it('adds the rank only if the list has the entry', () => {
    const ranks = new Map([['我们', 2]])

    expect(withFrequencyRank({ hanzi: '我们' }, ranks)).toEqual({ hanzi: '我们', frequencyRank: 2 })
    expect(withFrequencyRank({ hanzi: '柠檬' }, ranks)).toEqual({ hanzi: '柠檬' })
  })
})
