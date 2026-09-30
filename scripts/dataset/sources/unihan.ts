/**
 * Unihan adapter (Unicode 18.0, Unicode License v3).
 *
 * Responsibility: stroke count, Kangxi radical (character and number) and
 * traditional forms of each character. Reads the Unihan.zip files
 * (`Unihan_IRGSources.txt`, `Unihan_Variants.txt`) and `CJKRadicals.txt`.
 */

/** What Unihan contributes to a character. Fields Unihan does not have are absent. */
export interface UnihanCharacter {
  strokeCount?: number
  radical?: string
  radicalNumber?: number
  traditional?: string[]
}

/** Unihan properties we use. */
const USED_PROPERTIES = new Set(['kRSUnicode', 'kTotalStrokes', 'kTraditionalVariant'])

function fromCodePoint(hex: string): string {
  return String.fromCodePoint(Number.parseInt(hex, 16))
}

/**
 * Reads Unihan lines ("U+67E0<TAB>kRSUnicode<TAB>75.5") and returns, per
 * character, the properties we use. `wanted` limits reading to the
 * dataset's characters.
 */
export function parseUnihan(
  texts: readonly string[],
  wanted: ReadonlySet<string>,
): Map<string, Map<string, string>> {
  const properties = new Map<string, Map<string, string>>()
  for (const text of texts) {
    for (const line of text.split('\n')) {
      if (line.startsWith('#') || line.trim() === '') continue
      const [codePoint, property, value] = line.split('\t')
      if (!codePoint || !property || value === undefined || !USED_PROPERTIES.has(property)) continue
      const hanzi = fromCodePoint(codePoint.slice(2))
      if (!wanted.has(hanzi)) continue
      const own = properties.get(hanzi) ?? new Map<string, string>()
      own.set(property, value.trim())
      properties.set(hanzi, own)
    }
  }
  return properties
}

/**
 * Reads `CJKRadicals.txt` ("75; 2F4A; 6728", "149'; 2EC8; 8BA0") and returns
 * the radical number (with an apostrophe for the simplified form) → the
 * radical's normal character (木, 讠).
 */
export function parseCjkRadicals(text: string): Map<string, string> {
  const radicals = new Map<string, string>()
  for (const line of text.split('\n')) {
    if (line.startsWith('#') || line.trim() === '') continue
    const [radicalNumber, , ideograph] = line.split(';').map((field) => field.trim())
    if (radicalNumber && ideograph) radicals.set(radicalNumber, fromCodePoint(ideograph))
  }
  return radicals
}

/**
 * Converts a character's properties into dataset data.
 *
 * - kRSUnicode can have several values ("9.5 212.2"): the first is the
 *   normative one. "149'.6" is radical 149 in simplified form (讠).
 * - kTotalStrokes can have two values: the first is mainland China's
 *   (simplified Chinese), which is the one we use.
 */
export function toUnihanCharacter(
  properties: ReadonlyMap<string, string>,
  radicals: ReadonlyMap<string, string>,
): UnihanCharacter {
  const result: UnihanCharacter = {}

  const strokes = properties.get('kTotalStrokes')?.split(' ')[0]
  if (strokes) result.strokeCount = Number(strokes)

  const radicalStroke = properties.get('kRSUnicode')?.split(' ')[0]
  const radicalKey = radicalStroke?.split('.')[0]
  if (radicalKey) {
    result.radicalNumber = Number.parseInt(radicalKey, 10)
    const radical = radicals.get(radicalKey)
    if (radical) result.radical = radical
  }

  const traditional = properties.get('kTraditionalVariant')
  if (traditional) {
    result.traditional = [...traditional.matchAll(/U\+([0-9A-F]+)/g)].map((match) => fromCodePoint(match[1]!))
  }

  return result
}

/** All together: the Unihan data for each requested character that exists in Unihan. */
export function loadUnihan(
  unihanTexts: readonly string[],
  radicalsText: string,
  wanted: ReadonlySet<string>,
): Map<string, UnihanCharacter> {
  const radicals = parseCjkRadicals(radicalsText)
  const result = new Map<string, UnihanCharacter>()
  for (const [hanzi, properties] of parseUnihan(unihanTexts, wanted)) {
    result.set(hanzi, toUnihanCharacter(properties, radicals))
  }
  return result
}
