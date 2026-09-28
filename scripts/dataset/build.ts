/**
 * Genera el dataset de HanziVocab a partir de fuentes abiertas.
 *
 *   fuentes (.cache) → adaptadores (sources/) → fusión (fusion.ts) → validación → src/data
 *
 * Uso:
 *   npm run data:fetch   # descarga las fuentes (versiones fijadas)
 *   npm run data:build   # genera los archivos de datos
 *
 * El script no inventa nada: si algo no cuadra, se detiene y dice qué.
 * Fuentes y licencias en docs/DATA_SOURCES.md.
 */
import { createReadStream, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ExampleSet } from '../../src/features/dictionary/types.ts'
import { validateDictionaryData, validateExampleSet } from '../../src/features/dictionary/validation.ts'
import { strokeFileName } from '../../src/features/dictionary/strokes.ts'
import { buildBaseEntries, crossCheckCharacter, enrichCharacter, type CharacterSources } from './fusion.ts'
import { createCedictIndex } from './sources/cedict.ts'
import { readStrokeData, type StrokeData } from './sources/hanziWriter.ts'
import { parseHskList } from './sources/hsk.ts'
import { parseMakeMeAHanzi } from './sources/makemeahanzi.ts'
import { parseLinkLine, parseSentenceLine, selectExamples, type TatoebaSentence } from './sources/tatoeba.ts'
import { loadUnihan, type UnihanCharacter } from './sources/unihan.ts'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const cacheDir = join(scriptDir, '.cache')
const rootDir = join(scriptDir, '../..')
const outputDir = join(rootDir, 'src/data/hsk1')
const strokesDir = join(rootDir, 'public/strokes')
const examplesDir = join(rootDir, 'public/examples')
const conflictsReport = join(rootDir, 'docs/DATA_CONFLICTS.md')
const hanziWriterDataDir = join(rootDir, 'node_modules/hanzi-writer-data')

/*
 * `--without=unihan,tatoeba` genera el dataset sin esas fuentes. Solo sirve
 * para probar el script donde no se pueden descargar (el entorno en la nube
 * de Claude): el resultado no se debe subir al repositorio.
 */
const skippedSources = new Set(
  process.argv
    .find((arg) => arg.startsWith('--without='))
    ?.slice('--without='.length)
    .split(',') ?? [],
)
for (const source of skippedSources) {
  console.warn(`AVISO: se genera el dataset SIN ${source}. No subas este resultado al repositorio.`)
}

/** Lee un archivo descargado por data:fetch, o se detiene explicando qué falta. */
function readSource(file: string): string {
  return readFileSync(sourcePath(file), 'utf8')
}

function sourcePath(file: string): string {
  const path = join(cacheDir, file)
  if (!existsSync(path)) {
    console.error(`Falta ${path}. Ejecuta "npm run data:fetch" (ver docs/DATA_SOURCES.md).`)
    process.exit(1)
  }
  return path
}

/** Lee un archivo grande línea a línea (las frases en inglés de Tatoeba ocupan cientos de MB). */
async function* readLines(file: string): AsyncGenerator<string> {
  yield* createInterface({ input: createReadStream(sourcePath(file), 'utf8'), crlfDelay: Infinity })
}

// --- Fuentes base: lista HSK + CC-CEDICT ----------------------------------

const hskList = parseHskList(readSource('hsk-level-1.json'))
const cedict = createCedictIndex(readSource('cedict.json'))
const base = buildBaseEntries(hskList, cedict, 1)
const { words, problems } = base
const hanziSet = new Set(base.characters.map((character) => character.hanzi))

// --- Make Me a Hanzi: descomposición y etimología ------------------------

const makeMeAHanzi = parseMakeMeAHanzi(readSource('makemeahanzi-dictionary.txt'), hanziSet)

// --- Unihan: trazos, radical, tradicional ----------------------------------
// También se lee para los radicales de Make Me a Hanzi, para poder
// comparar radicales escritos en otra forma (亻 y 人 son el radical 9).
const makeMeAHanziRadicals = new Set([...makeMeAHanzi.values()].map((entry) => entry.radical))
const unihan = skippedSources.has('unihan')
  ? new Map<string, UnihanCharacter>()
  : loadUnihan(
      [readSource('unihan/Unihan_IRGSources.txt'), readSource('unihan/Unihan_Variants.txt')],
      readSource('unihan/CJKRadicals.txt'),
      new Set([...hanziSet, ...makeMeAHanziRadicals]),
    )

// --- hanzi-writer-data: trazos (paquete npm fijado en package.json) --------

const strokeData = new Map<string, StrokeData>()
for (const hanzi of hanziSet) {
  const data = readStrokeData(hanziWriterDataDir, hanzi)
  if (data) strokeData.set(hanzi, data)
  else problems.push(`Carácter ${hanzi}: sin datos de trazos en hanzi-writer-data`)
}

// --- Fusión y comprobaciones cruzadas --------------------------------------

const conflicts: string[] = []
const characters = base.characters.map((character) => {
  const sources: CharacterSources = {
    unihan: unihan.get(character.hanzi),
    makeMeAHanzi: makeMeAHanzi.get(character.hanzi),
    hanziWriterStrokeCount: strokeData.get(character.hanzi)?.strokeCount,
  }
  const makeMeAHanziRadical = sources.makeMeAHanzi?.radical
  if (makeMeAHanziRadical !== undefined) {
    sources.makeMeAHanziRadicalNumber = unihan.get(makeMeAHanziRadical)?.radicalNumber
  }
  conflicts.push(...crossCheckCharacter(character.hanzi, sources))
  return enrichCharacter(character, sources)
})

// --- Tatoeba: frases de ejemplo --------------------------------------------

let examples: ExampleSet | undefined
if (!skippedSources.has('tatoeba')) {
  const chinese = new Map<number, TatoebaSentence>()
  for await (const line of readLines('tatoeba/cmn_sentences_detailed.tsv')) {
    const sentence = parseSentenceLine(line)
    if (sentence) chinese.set(sentence.id, sentence)
  }
  const translations = new Map<number, number[]>()
  for await (const line of readLines('tatoeba/cmn-eng_links.tsv')) {
    const link = parseLinkLine(line)
    if (!link || !chinese.has(link[0])) continue
    translations.set(link[0], [...(translations.get(link[0]) ?? []), link[1]])
  }
  // Del inglés solo se guardan las frases enlazadas con alguna china
  const wantedEnglish = new Set([...translations.values()].flat())
  const english = new Map<number, TatoebaSentence>()
  for await (const line of readLines('tatoeba/eng_sentences_detailed.tsv')) {
    const sentence = parseSentenceLine(line)
    if (sentence && wantedEnglish.has(sentence.id)) english.set(sentence.id, sentence)
  }
  examples = {
    source: 'Tatoeba',
    license: 'CC BY 2.0 FR',
    exportDate: readSource('tatoeba/export-date.txt').trim(),
    sentences: selectExamples({
      words: words.map((word) => word.hanzi),
      knownCharacters: hanziSet,
      chinese,
      english,
      translations,
    }),
  }
}

// --- Validación y escritura ----------------------------------------------

problems.push(...validateDictionaryData(characters, words))
if (examples) problems.push(...validateExampleSet(examples, words))
if (problems.length > 0) {
  console.error(`No se ha generado el dataset. Problemas:\n- ${problems.join('\n- ')}`)
  process.exit(1)
}

const header = `// Generado por scripts/dataset/build.ts. No editar a mano: cambia el script y vuelve a generarlo.
// Significados y lecturas: CC-CEDICT (https://cc-cedict.org), licencia CC BY-SA 4.0.
// Trazos, radicales y formas tradicionales de los caracteres: Unihan de Unicode 18.0 (Unicode License v3).
// Descomposición y etimología: Make Me a Hanzi (LGPL 3.0 o posterior).
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

// Trazos: se copian tal cual, uno por carácter, para cargarlos al abrir la ficha.
// Se borra la carpeta antes para que no queden archivos de caracteres que ya no están.
rmSync(strokesDir, { recursive: true, force: true })
mkdirSync(strokesDir, { recursive: true })
for (const [hanzi, data] of strokeData) writeFileSync(join(strokesDir, strokeFileName(hanzi)), data.json)

// Ejemplos: un JSON por nivel, que la ficha pide al abrirse.
if (examples) {
  mkdirSync(examplesDir, { recursive: true })
  writeFileSync(join(examplesDir, 'hsk1.json'), `${JSON.stringify(examples, null, 1)}\n`)
}

writeFileSync(
  conflictsReport,
  `# Desacuerdos entre fuentes

Generado por \`npm run data:build\`. No editar a mano.

Cada línea es un dato en el que dos fuentes no coinciden. El dataset usa la
fuente dueña del campo (ver docs/DATA_SOURCES.md) y aquí se deja constancia
para revisarlo.

${conflicts.length === 0 ? 'Ninguno.' : conflicts.map((conflict) => `- ${conflict}`).join('\n')}
`,
)

console.log(`Dataset HSK 1 generado: ${words.length} palabras y ${characters.length} caracteres.`)
console.log(`Trazos copiados a public/strokes: ${strokeData.size}.`)
if (examples) console.log(`Frases de ejemplo de Tatoeba (${examples.exportDate}): ${examples.sentences.length}.`)
if (conflicts.length > 0) {
  console.warn(`${conflicts.length} desacuerdos entre fuentes (ver docs/DATA_CONFLICTS.md):\n- ${conflicts.join('\n- ')}`)
}
