/**
 * Valida el dataset ya generado (lo que está en el repositorio), sin
 * descargar nada: `npm run data:validate`.
 *
 * - Caracteres y palabras de src/data y del diccionario completo de
 *   data-release/dictionary (lo que se va a publicar en el repositorio de
 *   datos), juntos (validateDictionaryData y validateFullDictionary).
 * - Un archivo de trazos en public/strokes por cada carácter.
 * - Las frases de ejemplo de public/examples (validateExampleSet).
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { allCharacters, allWords } from '../../src/data/index.ts'
import { strokeFileName } from '../../src/features/dictionary/strokes.ts'
import type { ExampleSet } from '../../src/features/dictionary/types.ts'
import { validateDictionaryData, validateExampleSet, validateFullDictionary } from '../../src/features/dictionary/validation.ts'
import { DATA_RELEASE_DIR } from './dataRelease.ts'
import { readFullDictionary } from './fullDictionaryFiles.ts'

const publicDir = join(dirname(fileURLToPath(import.meta.url)), '../../public')

const chunks = readFullDictionary(join(DATA_RELEASE_DIR, 'dictionary'))
const fullCharacters = chunks.flatMap((chunk) => chunk.characters)
const fullWords = chunks.flatMap((chunk) => chunk.words)
const problems = [
  ...validateDictionaryData([...allCharacters, ...fullCharacters], [...allWords, ...fullWords]),
  ...validateFullDictionary(chunks),
]

for (const character of allCharacters) {
  if (!existsSync(join(publicDir, 'strokes', strokeFileName(character.hanzi)))) {
    problems.push(`Carácter ${character.hanzi}: falta public/strokes/${strokeFileName(character.hanzi)}`)
  }
}

const examplesDir = join(publicDir, 'examples')
const exampleFiles = existsSync(examplesDir) ? readdirSync(examplesDir).filter((file) => file.endsWith('.json')) : []
for (const file of exampleFiles) {
  const set: ExampleSet = JSON.parse(readFileSync(join(examplesDir, file), 'utf8'))
  problems.push(...validateExampleSet(set, allWords).map((problem) => `${file}: ${problem}`))
}
if (exampleFiles.length === 0) console.warn('AVISO: no hay frases de ejemplo en public/examples.')

if (problems.length > 0) {
  console.error(`El dataset tiene problemas:\n- ${problems.join('\n- ')}`)
  process.exit(1)
}
console.log(
  `Dataset correcto: ${allCharacters.length} caracteres, ${allWords.length} palabras, ${exampleFiles.length} archivos de ejemplos. ` +
    `Diccionario completo: ${fullCharacters.length} caracteres y ${fullWords.length} palabras más.`,
)
