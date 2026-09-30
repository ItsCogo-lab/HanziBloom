import type { RandomFn } from '../lib/random.ts'

/**
 * Seeded pseudorandom generator (mulberry32) for tests:
 * the same seed always produces the same sequence.
 */
export function seededRandom(seed: number): RandomFn {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let value = Math.imul(state ^ (state >>> 15), 1 | state)
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}
