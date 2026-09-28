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
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { validateDictionaryData } from '../../src/features/dictionary/validation.ts'
import { buildBaseEntries } from './fusion.ts'
import { createCedictIndex } from './sources/cedict.ts'
import { parseHskList } from './sources/hsk.ts'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const cacheDir = join(scriptDir, '.cache')
const outputDir = join(scriptDir, '../../src/data/hsk1')

const hskList = parseHskList(readFileSync(join(cacheDir, 'hsk-level-1.json'), 'utf8'))
const cedict = createCedictIndex(readFileSync(join(cacheDir, 'cedict.json'), 'utf8'))

const { characters, words, problems } = buildBaseEntries(hskList, cedict, 1)

// --- Validación y escritura ----------------------------------------------

problems.push(...validateDictionaryData(characters, words))
if (problems.length > 0) {
  console.error(`No se ha generado el dataset. Problemas:\n- ${problems.join('\n- ')}`)
  process.exit(1)
}

const header = `// Generado por scripts/dataset/build.ts. No editar a mano: cambia el script y vuelve a generarlo.
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
