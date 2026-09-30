/*
 * Unicode Ideographic Description Sequences (IDS), the format of
 * `decomposition` in Make Me a Hanzi: "⿰木宁" = 木 to the left of 宁.
 * Each operator (⿰, ⿱...) is followed by its 2 or 3 components, which can
 * themselves be another sequence: "⿰亻⿱夂彡". "？" marks an unknown component.
 */

/** Number of components that follow each IDS operator. */
const OPERATOR_ARITY: Record<string, number> = {
  '⿰': 2, '⿱': 2, '⿲': 3, '⿳': 3, '⿴': 2, '⿵': 2, '⿶': 2, '⿷': 2,
  '⿸': 2, '⿹': 2, '⿺': 2, '⿻': 2, '⿼': 2, '⿽': 2, '⿾': 1, '⿿': 1, '㇯': 2,
}

const UNKNOWN_COMPONENT = '？'

/**
 * Reads a sequence starting at `start` and returns where it ends, or -1 if
 * it's incomplete.
 */
function parseFrom(symbols: readonly string[], start: number): number {
  const symbol = symbols[start]
  if (symbol === undefined) return -1
  const arity = OPERATOR_ARITY[symbol]
  if (arity === undefined) return start + 1
  let next = start + 1
  for (let i = 0; i < arity; i++) {
    next = parseFrom(symbols, next)
    if (next === -1) return -1
  }
  return next
}

/** Whether a decomposition is a complete, well-formed IDS sequence. */
export function isValidIds(decomposition: string): boolean {
  const symbols = Array.from(decomposition)
  return symbols.length > 0 && parseFrom(symbols, 0) === symbols.length
}

/**
 * Components of a decomposition, in order and without repeats, with no operators
 * or unknown components: "⿰木宁" → [木, 宁]; "⿰亻⿱夂彡" → [亻, 夂, 彡].
 */
export function getComponents(decomposition: string): string[] {
  const components = Array.from(decomposition).filter(
    (symbol) => OPERATOR_ARITY[symbol] === undefined && symbol !== UNKNOWN_COMPONENT,
  )
  return [...new Set(components)]
}
