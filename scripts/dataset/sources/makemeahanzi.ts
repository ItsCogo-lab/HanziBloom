/**
 * Make Me a Hanzi adapter, `dictionary.txt` file (LGPL 3.0 or later).
 *
 * Responsibility: decomposition into components, etymology (semantic and
 * phonetic) and radical. The radical is only used to check Unihan's.
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

/**
 * Removes the source's nulls: in the dataset, a value that does not exist does
 * not appear. Also leading and trailing spaces and line breaks, which
 * some entries contain by mistake (瓣: phonetic "\n\n…辡").
 */
function toEtymology(raw: RawEntry['etymology']): Etymology | undefined {
  if (!raw) return undefined
  if (!ETYMOLOGY_TYPES.includes(raw.type as Etymology['type'])) {
    throw new Error(`Make Me a Hanzi: unknown etymology type "${raw.type}"`)
  }
  const hint = raw.hint?.trim()
  const semantic = raw.semantic?.trim()
  const phonetic = raw.phonetic?.trim()
  return {
    type: raw.type as Etymology['type'],
    ...(hint && { hint }),
    ...(semantic && { semantic }),
    ...(phonetic && { phonetic }),
  }
}

/**
 * Reads `dictionary.txt` (one JSON object per line) and returns the requested
 * characters. A decomposition starting with "？" is unknown according to the
 * project itself, so it is not used.
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
