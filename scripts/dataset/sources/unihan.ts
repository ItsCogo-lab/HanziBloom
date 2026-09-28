/**
 * Adaptador de Unihan (Unicode 18.0, Unicode License v3).
 *
 * Responsabilidad: número de trazos, radical Kangxi (carácter y número) y
 * formas tradicionales de cada carácter. Lee los archivos de Unihan.zip
 * (`Unihan_IRGSources.txt`, `Unihan_Variants.txt`) y `CJKRadicals.txt`.
 */

/** Lo que aporta Unihan a un carácter. Los campos que Unihan no tiene no aparecen. */
export interface UnihanCharacter {
  strokeCount?: number
  radical?: string
  radicalNumber?: number
  traditional?: string[]
}

/** Propiedades de Unihan que usamos. */
const USED_PROPERTIES = new Set(['kRSUnicode', 'kTotalStrokes', 'kTraditionalVariant'])

function fromCodePoint(hex: string): string {
  return String.fromCodePoint(Number.parseInt(hex, 16))
}

/**
 * Lee líneas de Unihan ("U+67E0<TAB>kRSUnicode<TAB>75.5") y devuelve, por
 * carácter, las propiedades que usamos. `wanted` limita la lectura a los
 * caracteres del dataset.
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
 * Lee `CJKRadicals.txt` ("75; 2F4A; 6728", "149'; 2EC8; 8BA0") y devuelve
 * el número de radical (con apóstrofo si es la forma simplificada) → el
 * carácter normal del radical (木, 讠).
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
 * Convierte las propiedades de un carácter en datos del dataset.
 *
 * - kRSUnicode puede tener varios valores ("9.5 212.2"): el primero es el
 *   normativo. "149'.6" es el radical 149 en forma simplificada (讠).
 * - kTotalStrokes puede tener dos valores: el primero es el de China
 *   continental (chino simplificado), que es el que usamos.
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

/** Todo junto: los datos de Unihan de cada carácter pedido que exista en Unihan. */
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
