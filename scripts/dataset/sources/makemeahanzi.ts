/**
 * Adaptador de Make Me a Hanzi, archivo `dictionary.txt` (LGPL 3.0 o posterior).
 *
 * Responsabilidad: descomposición en componentes, etimología (semántico y
 * fonético) y radical. El radical solo se usa para comprobar el de Unihan.
 */
import type { Etymology } from '../../../src/features/dictionary/types.ts'

export interface MakeMeAHanziCharacter {
  radical: string
  decomposition?: string
  etymology?: Etymology
}

const ETYMOLOGY_TYPES: readonly Etymology['type'][] = ['pictographic', 'ideographic', 'pictophonetic']

interface RawEntry {
  character: string
  radical: string
  decomposition: string
  etymology?: { type: string; hint?: string | null; semantic?: string | null; phonetic?: string | null } | null
}

/** Quita los null de la fuente: en el dataset, un dato que no existe no aparece. */
function toEtymology(raw: RawEntry['etymology']): Etymology | undefined {
  if (!raw) return undefined
  if (!ETYMOLOGY_TYPES.includes(raw.type as Etymology['type'])) {
    throw new Error(`Make Me a Hanzi: tipo de etimología desconocido "${raw.type}"`)
  }
  return {
    type: raw.type as Etymology['type'],
    ...(raw.hint && { hint: raw.hint }),
    ...(raw.semantic && { semantic: raw.semantic }),
    ...(raw.phonetic && { phonetic: raw.phonetic }),
  }
}

/**
 * Lee `dictionary.txt` (un objeto JSON por línea) y devuelve los caracteres
 * pedidos. Una descomposición que empieza por "？" es desconocida según el
 * propio proyecto, así que no se usa.
 */
export function parseMakeMeAHanzi(text: string, wanted: ReadonlySet<string>): Map<string, MakeMeAHanziCharacter> {
  const result = new Map<string, MakeMeAHanziCharacter>()
  for (const line of text.split('\n')) {
    if (line.trim() === '') continue
    const entry: RawEntry = JSON.parse(line)
    if (!wanted.has(entry.character)) continue
    const etymology = toEtymology(entry.etymology)
    result.set(entry.character, {
      radical: entry.radical,
      ...(!entry.decomposition.startsWith('？') && { decomposition: entry.decomposition }),
      ...(etymology && { etymology }),
    })
  }
  return result
}
