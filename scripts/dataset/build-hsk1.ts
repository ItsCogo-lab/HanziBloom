/**
 * Genera el dataset de HSK 1 (HSK 2.0) a partir de fuentes abiertas:
 *
 * - Lista de palabras y su pinyin de examen: clem109/hsk-vocabulary (MIT).
 * - Significados en inglés y lecturas de cada carácter: CC-CEDICT (CC BY-SA 4.0).
 *
 * Uso:
 *   npm run data:fetch   # descarga las fuentes (una vez)
 *   npm run data:build   # genera src/data/hsk1/*.ts
 *
 * El script no inventa nada: si una palabra o un carácter no se puede
 * emparejar con CC-CEDICT, se detiene y dice cuál. Las únicas decisiones
 * manuales están en PREFERRED_TRADITIONAL, con su motivo.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Character, Word } from '../../src/features/dictionary/types.ts'
import { validateDictionaryData } from '../../src/features/dictionary/validation.ts'
import { numberedPinyinToToneMarks, removeToneMarks } from '../../src/lib/pinyin.ts'

type HskListEntry = { hanzi: string; pinyin: string }
type CedictEntry = { traditional: string; simplified: string; pinyin: string; english: string[] }

/** Máximo de significados por entrada: los primeros de CC-CEDICT suelen ser los principales. */
const MAX_MEANINGS = 6

/**
 * Cuando CC-CEDICT tiene varias entradas con la misma lectura, se usan todas
 * en su orden. Aquí se elige una forma tradicional concreta cuando el orden
 * de CC-CEDICT pondría primero un sentido que no es el de HSK 1.
 */
const PREFERRED_TRADITIONAL: Record<string, string> = {
  // 里 "dentro" (裡) y no la unidad de longitud "li" (里)
  里: '裡',
  // Evitan las entradas de las variantes 妳 (nota sobre Taiwán) y 秊 (sentidos antiguos)
  你: '你',
  年: '年',
}

/** Significados que son notas de diccionario y no traducciones útiles para estudiar. */
const NON_TRANSLATION_MEANINGS = [
  /^(old |unofficial |archaic |erroneous )?variant of /i,
  /^see /i,
  /^used in /i,
  /^surname /i,
  /^\(surname\)/i,
  /^abbr\. for /i,
  /^CL:/,
  /^Taiwan pr\./i,
  /^also pr\./i,
  /^Kangxi radical/i,
]

const scriptDir = dirname(fileURLToPath(import.meta.url))
const cacheDir = join(scriptDir, '.cache')
const outputDir = join(scriptDir, '../../src/data/hsk1')

const hskList: HskListEntry[] = JSON.parse(readFileSync(join(cacheDir, 'hsk-level-1.json'), 'utf8'))
const cedict: CedictEntry[] = JSON.parse(readFileSync(join(cacheDir, 'cedict.json'), 'utf8'))

const cedictBySimplified = new Map<string, CedictEntry[]>()
for (const entry of cedict) {
  const toneMarked = { ...entry, pinyin: numberedPinyinToToneMarks(entry.pinyin) }
  const list = cedictBySimplified.get(entry.simplified) ?? []
  list.push(toneMarked)
  cedictBySimplified.set(entry.simplified, list)
}

const problems: string[] = []

/**
 * Pinyin comparable: sin espacios, pero con tonos y mayúsculas. Las
 * mayúsculas importan: en CC-CEDICT marcan nombres propios (苹果 píng guǒ
 * "manzana" frente a Píng guǒ "Apple, la empresa").
 */
function comparablePinyin(pinyin: string): string {
  return pinyin.replace(/\s+/g, '')
}

/**
 * Limpia la notación interna de CC-CEDICT para que el texto se lea bien:
 * "(abbr. to 京[Jing1])" → "(abbr. to 京)", "兩|两[liang3]" → "两",
 * y quita las notas de clasificadores "(CL:...)" y de pronunciación en Taiwán.
 */
function cleanMeaning(meaning: string): string {
  return meaning
    .replace(/\s*\((CL:|Taiwan pr\.)[^)]*\)/g, '')
    .replace(/\S+\|(\S+?)\[[^\]]+\]/g, '$1')
    .replace(/([\u3400-\u9fff]+)\[[^\]]+\]/g, '$1')
    .replace(/\[([^\]]+)\]/g, (_match, pinyin: string) => numberedPinyinToToneMarks(pinyin))
    .trim()
}

function hasToneMark(syllable: string): boolean {
  return removeToneMarks(syllable) !== syllable.toLowerCase()
}

/**
 * Significados útiles para estudiar. Si una lectura solo tiene notas (漂 piào:
 * "used in 漂亮"), se conservan las notas: dicen algo cierto y útil.
 */
function usableMeanings(entries: CedictEntry[]): string[] {
  const all = entries.flatMap((entry) => entry.english)
  const translations = all.filter((meaning) => !NON_TRANSLATION_MEANINGS.some((pattern) => pattern.test(meaning)))
  const meanings = (translations.length > 0 ? translations : all).map(cleanMeaning).filter((meaning) => meaning !== '')
  return [...new Set(meanings)].slice(0, MAX_MEANINGS)
}

/** Entradas de CC-CEDICT de un hanzi con una lectura concreta. */
function findEntries(hanzi: string, pinyin: string): CedictEntry[] {
  const entries = (cedictBySimplified.get(hanzi) ?? []).filter(
    (entry) => comparablePinyin(entry.pinyin) === comparablePinyin(pinyin),
  )
  const preferred = PREFERRED_TRADITIONAL[hanzi]
  return preferred ? entries.filter((entry) => entry.traditional === preferred) : entries
}

// --- Palabras -------------------------------------------------------------

const words: Word[] = hskList.map(({ hanzi, pinyin }) => {
  const meanings = usableMeanings(findEntries(hanzi, pinyin))
  if (meanings.length === 0) problems.push(`Palabra ${hanzi} [${pinyin}]: sin entrada en CC-CEDICT`)
  return { id: hanzi, hanzi, pinyin, meanings: { en: meanings }, hskLevel: 1 }
})

// --- Caracteres -----------------------------------------------------------

/**
 * Lectura de un carácter tal como se usa en una palabra de HSK 1.
 *
 * Si en la palabra lleva tono neutro, se usa la entrada de CC-CEDICT con ese
 * tono neutro si existe (吗 ma, 们 men, 子 zi); si no, la lectura con tono
 * (东西 dōng xi → 西 xī), que es la del carácter aislado.
 */
function readingOf(hanzi: string, syllable: string): string | undefined {
  const candidates = (cedictBySimplified.get(hanzi) ?? [])
    .map((entry) => entry.pinyin)
    .filter((pinyin) => pinyin === pinyin.toLowerCase())
  if (hasToneMark(syllable)) return candidates.find((pinyin) => pinyin === syllable)

  const sameSyllable = candidates.filter((pinyin) => removeToneMarks(pinyin) === syllable)
  return sameSyllable.find((pinyin) => pinyin === syllable) ?? sameSyllable[0]
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

const readingsByCharacter = new Map<string, string[]>()
// Caracteres que aparecen en nombres propios (汉语 Hàn yǔ, 中国 Zhōng guó):
// para ellos también sirven las entradas en mayúscula (汉 "Han; Chinese").
const properNounCharacters = new Set<string>()

for (const { hanzi, pinyin } of hskList) {
  const characters = Array.from(hanzi)
  const syllables = pinyin.split(/\s+/)
  if (characters.length !== syllables.length) {
    problems.push(`Palabra ${hanzi} [${pinyin}]: no hay una sílaba por carácter`)
    continue
  }
  characters.forEach((character, index) => {
    const syllable = syllables[index]!
    if (syllable !== syllable.toLowerCase()) properNounCharacters.add(character)

    const reading = readingOf(character, syllable.toLowerCase())
    if (!reading) {
      problems.push(`Carácter ${character} [${syllable}] (en ${hanzi}): sin lectura en CC-CEDICT`)
      return
    }
    const readings = readingsByCharacter.get(character) ?? []
    if (!readings.includes(reading)) readings.push(reading)
    readingsByCharacter.set(character, readings)
  })
}

const characters: Character[] = [...readingsByCharacter].map(([hanzi, readings]) => {
  const entries = readings.flatMap((reading) => [
    ...(properNounCharacters.has(hanzi) ? findEntries(hanzi, capitalize(reading)) : []),
    ...findEntries(hanzi, reading),
  ])
  return { id: hanzi, hanzi, pinyin: readings, meanings: { en: usableMeanings(entries) }, hskLevel: 1 }
})

// --- Validación y escritura ----------------------------------------------

problems.push(...validateDictionaryData(characters, words))
if (problems.length > 0) {
  console.error(`No se ha generado el dataset. Problemas:\n- ${problems.join('\n- ')}`)
  process.exit(1)
}

const header = `// Generado por scripts/dataset/build-hsk1.ts. No editar a mano: cambia el script y vuelve a generarlo.
// Significados y lecturas: CC-CEDICT (https://cc-cedict.org), licencia CC BY-SA 4.0.
// Lista de palabras HSK 2.0: clem109/hsk-vocabulary (MIT). Detalles en docs/DATA_SOURCES.md.
`

function writeDataFile(fileName: string, typeName: 'Character' | 'Word', exportName: string, entries: object[]) {
  const lines = entries.map((entry) => `  ${JSON.stringify(entry)},`).join('\n')
  const content = `${header}import type { ${typeName} } from '../../features/dictionary/types.ts'

export const ${exportName}: ${typeName}[] = [
${lines}
]
`
  writeFileSync(join(outputDir, fileName), content)
}

writeDataFile('characters.ts', 'Character', 'hsk1Characters', characters)
writeDataFile('words.ts', 'Word', 'hsk1Words', words)
console.log(`Dataset HSK 1 generado: ${words.length} palabras y ${characters.length} caracteres.`)
