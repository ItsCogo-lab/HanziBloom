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
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { validateDictionaryData } from '../../src/features/dictionary/validation.ts'
import { strokeFileName } from '../../src/features/dictionary/strokes.ts'
import { buildBaseEntries, crossCheckCharacter, enrichCharacter, type CharacterSources } from './fusion.ts'
import { createCedictIndex } from './sources/cedict.ts'
import { readStrokeData, type StrokeData } from './sources/hanziWriter.ts'
import { parseHskList } from './sources/hsk.ts'
import { parseMakeMeAHanzi } from './sources/makemeahanzi.ts'
import { loadUnihan } from './sources/unihan.ts'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const cacheDir = join(scriptDir, '.cache')
const rootDir = join(scriptDir, '../..')
const outputDir = join(rootDir, 'src/data/hsk1')
const strokesDir = join(rootDir, 'public/strokes')
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
  const path = join(cacheDir, file)
  if (!existsSync(path)) {
    console.error(`Falta ${path}. Ejecuta "npm run data:fetch" (ver docs/DATA_SOURCES.md).`)
    process.exit(1)
  }
  return readFileSync(path, 'utf8')
}

// --- Fuentes base: lista HSK + CC-CEDICT ----------------------------------

const hskList = parseHskList(readSource('hsk-level-1.json'))
const cedict = createCedictIndex(readSource('cedict.json'))
const base = buildBaseEntries(hskList, cedict, 1)
const { words, problems } = base
const hanziSet = new Set(base.characters.map((character) => character.hanzi))

// --- Unihan: trazos, radical, tradicional ----------------------------------

const unihan = skippedSources.has('unihan')
  ? new Map()
  : loadUnihan(
      [readSource('unihan/Unihan_IRGSources.txt'), readSource('unihan/Unihan_Variants.txt')],
      readSource('unihan/CJKRadicals.txt'),
      hanziSet,
    )

// --- Make Me a Hanzi: descomposición y etimología ------------------------

const makeMeAHanzi = parseMakeMeAHanzi(readSource('makemeahanzi-dictionary.txt'), hanziSet)

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
  conflicts.push(...crossCheckCharacter(character.hanzi, sources))
  return enrichCharacter(character, sources)
})

// --- Validación y escritura ----------------------------------------------

problems.push(...validateDictionaryData(characters, words))
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
if (conflicts.length > 0) {
  console.warn(`${conflicts.length} desacuerdos entre fuentes (ver docs/DATA_CONFLICTS.md):\n- ${conflicts.join('\n- ')}`)
}
