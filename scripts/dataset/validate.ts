/**
 * Validates the already generated dataset (what is in the repository), without
 * downloading anything: `npm run data:validate`.
 *
 * - Characters and words from src/data and from the full dictionary in
 *   data-release/dictionary (what will be published to the data
 *   repository), together (validateDictionaryData and validateFullDictionary).
 * - A stroke file in public/strokes for each character.
 * - The example sentences in public/examples (validateExampleSet).
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
    problems.push(`Character ${character.hanzi}: missing public/strokes/${strokeFileName(character.hanzi)}`)
  }
}

const examplesDir = join(publicDir, 'examples')
const exampleFiles = existsSync(examplesDir) ? readdirSync(examplesDir).filter((file) => file.endsWith('.json')) : []
for (const file of exampleFiles) {
  const set: ExampleSet = JSON.parse(readFileSync(join(examplesDir, file), 'utf8'))
  problems.push(...validateExampleSet(set, allWords).map((problem) => `${file}: ${problem}`))
}
if (exampleFiles.length === 0) console.warn('WARNING: no example sentences in public/examples.')

if (problems.length > 0) {
  console.error(`The dataset has problems:\n- ${problems.join('\n- ')}`)
  process.exit(1)
}
console.log(
  `Dataset OK: ${allCharacters.length} characters, ${allWords.length} words, ${exampleFiles.length} example files. ` +
    `Full dictionary: ${fullCharacters.length} more characters and ${fullWords.length} more words.`,
)
