/**
 * Función que devuelve un número entre 0 (incluido) y 1 (excluido), como
 * Math.random. Se pasa como parámetro para que los tests puedan usar una
 * secuencia fija y obtener siempre el mismo resultado.
 */
export type RandomFn = () => number

/** Devuelve una copia desordenada del array (algoritmo de Fisher-Yates). */
export function shuffle<T>(items: readonly T[], random: RandomFn = Math.random): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j]!, result[i]!]
  }
  return result
}

/** Elige `count` elementos distintos al azar (o todos, si hay menos). */
export function sample<T>(items: readonly T[], count: number, random: RandomFn = Math.random): T[] {
  return shuffle(items, random).slice(0, count)
}
