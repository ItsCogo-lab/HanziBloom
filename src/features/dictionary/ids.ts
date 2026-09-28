/*
 * Secuencias de descripción ideográfica (IDS) de Unicode, el formato de
 * `decomposition` en Make Me a Hanzi: "⿰木宁" = 木 a la izquierda de 宁.
 * Cada operador (⿰, ⿱...) va seguido de sus 2 o 3 componentes, que pueden
 * ser a su vez otra secuencia: "⿰亻⿱夂彡". "？" marca un componente desconocido.
 */

/** Número de componentes que sigue a cada operador IDS. */
const OPERATOR_ARITY: Record<string, number> = {
  '⿰': 2, '⿱': 2, '⿲': 3, '⿳': 3, '⿴': 2, '⿵': 2, '⿶': 2, '⿷': 2,
  '⿸': 2, '⿹': 2, '⿺': 2, '⿻': 2, '⿼': 2, '⿽': 2, '⿾': 1, '⿿': 1, '㇯': 2,
}

const UNKNOWN_COMPONENT = '？'

/**
 * Lee una secuencia a partir de `start` y devuelve dónde termina, o -1 si
 * está incompleta.
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

/** Si una descomposición es una secuencia IDS completa y bien formada. */
export function isValidIds(decomposition: string): boolean {
  const symbols = Array.from(decomposition)
  return symbols.length > 0 && parseFrom(symbols, 0) === symbols.length
}

/**
 * Componentes de una descomposición, en orden y sin repetir, sin operadores
 * ni componentes desconocidos: "⿰木宁" → [木, 宁]; "⿰亻⿱夂彡" → [亻, 夂, 彡].
 */
export function getComponents(decomposition: string): string[] {
  const components = Array.from(decomposition).filter(
    (symbol) => OPERATOR_ARITY[symbol] === undefined && symbol !== UNKNOWN_COMPONENT,
  )
  return [...new Set(components)]
}
