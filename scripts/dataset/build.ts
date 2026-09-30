/**
 * Genera el dataset de HanziBloom a partir de fuentes abiertas.
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
import type { Character, ExampleSet, HskLevel, Word } from '../../src/features/dictionary/types.ts'
import { validateDictionaryData, validateExampleSet } from '../../src/features/dictionary/validation.ts'
import { strokeFileName } from '../../src/features/dictionary/strokes.ts'
import { CHUNK_COUNT, chunkFileName, getChunkIndex } from '../../src/features/dictionary/fullDictionary.ts'
import { buildBaseEntries, buildFullEntries, crossCheckCharacter, enrichCharacter, type CharacterSources } from './fusion.ts'
import { DATA_RELEASE_DIR } from './dataRelease.ts'
import { createCedictIndex } from './sources/cedict.ts'
import { readStrokeData, type StrokeData } from './sources/hanziWriter.ts'
import { parseHskList } from './sources/hsk.ts'
import { parseMakeMeAHanzi } from './sources/makemeahanzi.ts'
import { parseLinkLine, parseSentenceLine, selectExamples, type TatoebaSentence } from './sources/tatoeba.ts'
import { loadUnihan, type UnihanCharacter } from './sources/unihan.ts'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const cacheDir = join(scriptDir, '.cache')
const rootDir = join(scriptDir, '../..')
const dataDir = join(rootDir, 'src/data')
const strokesDir = join(rootDir, 'public/strokes')
const examplesDir = join(rootDir, 'public/examples')
const fullDictionaryDir = join(DATA_RELEASE_DIR, 'dictionary')
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

/** Niveles HSK 2.0 que se generan, cada uno en su carpeta src/data/hsk<n>/. */
const LEVELS: readonly HskLevel[] = [1, 2, 3, 4]

const hskLists = LEVELS.map((level) => ({ level, words: parseHskList(readSource(`hsk-level-${level}.json`)) }))
const cedict = createCedictIndex(readSource('cedict.json'))
const base = buildBaseEntries(hskLists, cedict)
const { words, problems, duplicates, leftOut } = base
const hanziSet = new Set(base.characters.map((character) => character.hanzi))

// El resto de CC-CEDICT, para el diccionario completo (repositorio de datos, ver dataRelease.ts)
const full = buildFullEntries(cedict, base)
const allHanzi = new Set([...hanziSet, ...full.characters.map((character) => character.hanzi)])

// --- Make Me a Hanzi: descomposición y etimología ------------------------

const makeMeAHanzi = parseMakeMeAHanzi(readSource('makemeahanzi-dictionary.txt'), allHanzi)

// --- Unihan: radical, tradicional ----------------------------------------
// También se lee para los radicales de Make Me a Hanzi, para poder
// comparar radicales escritos en otra forma (亻 y 人 son el radical 9).
const makeMeAHanziRadicals = new Set([...makeMeAHanzi.values()].map((entry) => entry.radical))
const unihan = skippedSources.has('unihan')
  ? new Map<string, UnihanCharacter>()
  : loadUnihan(
      [readSource('unihan/Unihan_IRGSources.txt'), readSource('unihan/Unihan_Variants.txt')],
      readSource('unihan/CJKRadicals.txt'),
      new Set([...allHanzi, ...makeMeAHanziRadicals]),
    )

// --- hanzi-writer-data: trazos (paquete npm fijado en package.json) --------

/*
 * Los trazos de HSK 1-4 se copian a public/strokes/. Del resto solo se usa el
 * número de trazos: copiar los ~9.500 archivos del paquete ocuparía unos 40 MB.
 */
const strokeData = new Map<string, StrokeData>()
for (const hanzi of hanziSet) {
  const data = readStrokeData(hanziWriterDataDir, hanzi)
  if (data) strokeData.set(hanzi, data)
  else problems.push(`Carácter ${hanzi}: sin datos de trazos en hanzi-writer-data`)
}
const fullStrokeCounts = new Map<string, number>()
for (const { hanzi } of full.characters) {
  const data = readStrokeData(hanziWriterDataDir, hanzi)
  if (data) fullStrokeCounts.set(hanzi, data.strokeCount)
}

// --- Fusión y comprobaciones cruzadas --------------------------------------

/** Añade a un carácter los campos de las demás fuentes y apunta los desacuerdos en `conflicts`. */
function enrich(character: Character, strokeCount: number | undefined, conflicts: string[]): Character {
  const sources: CharacterSources = {
    unihan: unihan.get(character.hanzi),
    makeMeAHanzi: makeMeAHanzi.get(character.hanzi),
    hanziWriterStrokeCount: strokeCount,
  }
  const makeMeAHanziRadical = sources.makeMeAHanzi?.radical
  if (makeMeAHanziRadical !== undefined) {
    sources.makeMeAHanziRadicalNumber = unihan.get(makeMeAHanziRadical)?.radicalNumber
  }
  conflicts.push(...crossCheckCharacter(character.hanzi, sources))
  return enrichCharacter(character, sources)
}

const conflicts: string[] = []
const characters = base.characters.map((character) =>
  enrich(character, strokeData.get(character.hanzi)?.strokeCount, conflicts),
)
const fullConflicts: string[] = []
const fullCharacters = full.characters.map((character) =>
  enrich(character, fullStrokeCounts.get(character.hanzi), fullConflicts),
)

// --- Tatoeba: frases de ejemplo --------------------------------------------

/*
 * Un archivo de frases por nivel. Las frases de un nivel solo usan caracteres
 * de ese nivel o de los anteriores, para que quien estudia HSK 1 pueda
 * leerlas enteras.
 */
const examplesByLevel = new Map<HskLevel, ExampleSet>()
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
  const exportDate = readSource('tatoeba/export-date.txt').trim()
  for (const level of LEVELS) {
    examplesByLevel.set(level, {
      source: 'Tatoeba',
      license: 'CC BY 2.0 FR',
      exportDate,
      sentences: selectExamples({
        words: [...new Set(words.filter((word) => word.hskLevel === level).map((word) => word.hanzi))],
        knownCharacters: new Set(
          base.characters.filter((character) => character.hskLevel !== undefined && character.hskLevel <= level).map((character) => character.hanzi),
        ),
        chinese,
        english,
        translations,
      }),
    })
  }
}

// --- Validación y escritura ----------------------------------------------

// HSK y el diccionario completo juntos: ids únicos entre los dos y caracteres de cada palabra presentes
problems.push(...validateDictionaryData([...characters, ...fullCharacters], [...words, ...full.words]))
for (const examples of examplesByLevel.values()) problems.push(...validateExampleSet(examples, words))
if (problems.length > 0) {
  console.error(`No se ha generado el dataset. Problemas:\n- ${problems.join('\n- ')}`)
  process.exit(1)
}

const header = `// Generado por scripts/dataset/build.ts. No editar a mano: cambia el script y vuelve a generarlo.
// Significados y lecturas: CC-CEDICT (https://cc-cedict.org), licencia CC BY-SA 4.0.
// Radicales y formas tradicionales de los caracteres: Unihan de Unicode 18.0 (Unicode License v3).
// Descomposición y etimología: Make Me a Hanzi (LGPL 3.0 o posterior).
// Número de trazos: hanzi-writer-data (Arphic Public License).
// Lista de palabras HSK 2.0: clem109/hsk-vocabulary (MIT). Detalles en docs/DATA_SOURCES.md.
`

function writeDataFile(level: HskLevel, typeName: 'Character' | 'Word', entries: readonly (Character | Word)[]) {
  const fileName = typeName === 'Character' ? 'characters.ts' : 'words.ts'
  const exportName = `hsk${level}${typeName === 'Character' ? 'Characters' : 'Words'}`
  const lines = entries
    .filter((entry) => entry.hskLevel === level)
    .map((entry) => `  ${JSON.stringify(entry)},`)
    .join('\n')
  const content = `${header}import type { ${typeName} } from '../../features/dictionary/types.ts'

export const ${exportName}: ${typeName}[] = [
${lines}
]
`
  const levelDir = join(dataDir, `hsk${level}`)
  mkdirSync(levelDir, { recursive: true })
  writeFileSync(join(levelDir, fileName), content)
}

for (const level of LEVELS) {
  writeDataFile(level, 'Character', characters)
  writeDataFile(level, 'Word', words)
}

// Trazos: se copian tal cual, uno por carácter, para cargarlos al abrir la ficha.
// Se borra la carpeta antes para que no queden archivos de caracteres que ya no están.
rmSync(strokesDir, { recursive: true, force: true })
mkdirSync(strokesDir, { recursive: true })
for (const [hanzi, data] of strokeData) writeFileSync(join(strokesDir, strokeFileName(hanzi)), data.json)

// Diccionario completo: CHUNK_COUNT archivos, cada entrada en el de su primer carácter
// (getChunkIndex). Una entrada por línea para que los cambios se lean bien en git.
const chunks = Array.from({ length: CHUNK_COUNT }, () => ({ characters: [] as Character[], words: [] as Word[] }))
for (const character of fullCharacters) chunks[getChunkIndex(character.hanzi)]!.characters.push(character)
for (const word of full.words) chunks[getChunkIndex(word.hanzi)]!.words.push(word)
const toLines = (entries: readonly object[]) => entries.map((entry) => JSON.stringify(entry)).join(',\n')
rmSync(fullDictionaryDir, { recursive: true, force: true })
mkdirSync(fullDictionaryDir, { recursive: true })
chunks.forEach((chunk, index) => {
  writeFileSync(
    join(fullDictionaryDir, chunkFileName(index)),
    `{"characters":[\n${toLines(chunk.characters)}\n],\n"words":[\n${toLines(chunk.words)}\n]}\n`,
  )
})

// Ejemplos: un JSON por nivel, que la ficha pide al abrirse.
if (examplesByLevel.size > 0) mkdirSync(examplesDir, { recursive: true })
for (const [level, examples] of examplesByLevel) {
  writeFileSync(join(examplesDir, `hsk${level}.json`), `${JSON.stringify(examples, null, 1)}\n`)
}

writeFileSync(
  conflictsReport,
  `# Desacuerdos entre fuentes

Generado por \`npm run data:build\`. No editar a mano.

Cada línea es un dato en el que dos fuentes no coinciden. El dataset usa la
fuente dueña del campo (ver docs/DATA_SOURCES.md) y aquí se deja constancia
para revisarlo.

${conflicts.length === 0 ? 'Ninguno.' : conflicts.map((conflict) => `- ${conflict}`).join('\n')}

## Palabras de la lista HSK que no están en el dataset

No hay una entrada de CC-CEDICT con ese hanzi y ese pinyin, así que no hay de
dónde sacar su significado. Se dejan fuera en lugar de inventarlo.

${leftOut.length === 0 ? 'Ninguna.' : leftOut.map((word) => `- ${word}`).join('\n')}

## Diccionario completo: desacuerdos entre fuentes

Lo mismo que arriba, para los caracteres del diccionario completo (fuera de HSK 1-4).

${fullConflicts.length === 0 ? 'Ninguno.' : fullConflicts.map((conflict) => `- ${conflict}`).join('\n')}

## Diccionario completo: entradas de CC-CEDICT que se dejan fuera

${full.leftOut.length === 0 ? 'Ninguna.' : full.leftOut.map((entry) => `- ${entry}`).join('\n')}

## Entradas repetidas en la lista HSK

La lista repite estas palabras con el mismo pinyin (con otro sentido). Se
guardan una sola vez.

${duplicates.length === 0 ? 'Ninguna.' : duplicates.map((word) => `- ${word}`).join('\n')}
`,
)

for (const level of LEVELS) {
  const count = (entries: readonly { hskLevel?: HskLevel }[]) => entries.filter((entry) => entry.hskLevel === level).length
  console.log(`HSK ${level}: ${count(words)} palabras y ${count(characters)} caracteres nuevos.`)
}
console.log(`Dataset generado: ${words.length} palabras y ${characters.length} caracteres.`)
if (leftOut.length > 0) console.warn(`Palabras sin entrada en CC-CEDICT, fuera del dataset: ${leftOut.join(', ')}.`)
if (duplicates.length > 0) {
  console.log(`Entradas repetidas en la lista HSK, guardadas una vez: ${duplicates.join(', ')}.`)
}
console.log(
  `Diccionario completo (data-release/dictionary, ${CHUNK_COUNT} archivos, para publicar con data:release): ${full.words.length} palabras y ${fullCharacters.length} caracteres más.`,
)
console.log(`Trazos copiados a public/strokes: ${strokeData.size}.`)
for (const [level, examples] of examplesByLevel) {
  console.log(`Frases de ejemplo de Tatoeba para HSK ${level} (${examples.exportDate}): ${examples.sentences.length}.`)
}
if (conflicts.length > 0) {
  console.warn(`${conflicts.length} desacuerdos entre fuentes (ver docs/DATA_CONFLICTS.md):\n- ${conflicts.join('\n- ')}`)
}
