import { describe, expect, it } from 'vitest'
import { seededRandom } from '../test/random.ts'
import { sample, shuffle } from './random.ts'

const numbers = [1, 2, 3, 4, 5, 6, 7, 8]

describe('shuffle', () => {
  it('conserva los mismos elementos', () => {
    expect(shuffle(numbers, seededRandom(1)).toSorted()).toEqual(numbers)
  })

  it('no modifica el array original', () => {
    const original = [...numbers]
    shuffle(numbers, seededRandom(1))
    expect(numbers).toEqual(original)
  })

  it('con la misma semilla da el mismo orden', () => {
    expect(shuffle(numbers, seededRandom(42))).toEqual(shuffle(numbers, seededRandom(42)))
  })
})

describe('sample', () => {
  it('elige la cantidad pedida sin repetir', () => {
    const picked = sample(numbers, 3, seededRandom(7))
    expect(picked).toHaveLength(3)
    expect(new Set(picked).size).toBe(3)
  })

  it('devuelve todos si se piden más de los que hay', () => {
    expect(sample(numbers, 20, seededRandom(7))).toHaveLength(numbers.length)
  })
})
