import type { RandomFn } from '../lib/random.ts'

/**
 * Generador pseudoaleatorio con semilla (mulberry32) para tests:
 * con la misma semilla produce siempre la misma secuencia.
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
