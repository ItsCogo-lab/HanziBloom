/**
 * Function that returns a number between 0 (inclusive) and 1 (exclusive), like
 * Math.random. It is passed as a parameter so tests can use a fixed sequence
 * and always get the same result.
 */
export type RandomFn = () => number

/** Returns a shuffled copy of the array (Fisher-Yates algorithm). */
export function shuffle<T>(items: readonly T[], random: RandomFn = Math.random): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j]!, result[i]!]
  }
  return result
}

/** Picks `count` distinct elements at random (or all of them, if there are fewer). */
export function sample<T>(items: readonly T[], count: number, random: RandomFn = Math.random): T[] {
  return shuffle(items, random).slice(0, count)
}
