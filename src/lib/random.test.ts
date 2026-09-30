import { describe, expect, it } from 'vitest'
import { seededRandom } from '../test/random.ts'
import { sample, shuffle } from './random.ts'

const numbers = [1, 2, 3, 4, 5, 6, 7, 8]

describe('shuffle', () => {
  it('keeps the same elements', () => {
    expect(shuffle(numbers, seededRandom(1)).toSorted()).toEqual(numbers)
  })

  it('does not modify the original array', () => {
    const original = [...numbers]
    shuffle(numbers, seededRandom(1))
    expect(numbers).toEqual(original)
  })

  it('gives the same order with the same seed', () => {
    expect(shuffle(numbers, seededRandom(42))).toEqual(shuffle(numbers, seededRandom(42)))
  })
})

describe('sample', () => {
  it('picks the requested amount without repeats', () => {
    const picked = sample(numbers, 3, seededRandom(7))
    expect(picked).toHaveLength(3)
    expect(new Set(picked).size).toBe(3)
  })

  it('returns all of them if more are requested than exist', () => {
    expect(sample(numbers, 20, seededRandom(7))).toHaveLength(numbers.length)
  })
})
