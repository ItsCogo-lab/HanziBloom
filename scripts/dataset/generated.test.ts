import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { allCharacters, allWords } from '../../src/data/index.ts'
import { strokeFileName } from '../../src/features/dictionary/strokes.ts'
import type { ExampleSet } from '../../src/features/dictionary/types.ts'
import { validateDictionaryData, validateExampleSet } from '../../src/features/dictionary/validation.ts'

/*
 * The generated files in public/ that the app loads. The full dictionary is
 * no longer in this repository: `npm run data:validate` checks it before
 * publishing it to the data repository.
 */

const publicDir = join(dirname(fileURLToPath(import.meta.url)), '../../public')
const exampleFiles = [1, 2, 3, 4].map((level) => join(publicDir, `examples/hsk${level}.json`))

describe('generated files in public/', () => {
  it('have the strokes for each character', () => {
    const missing = allCharacters.filter(
      (character) => !existsSync(join(publicDir, 'strokes', strokeFileName(character.hanzi))),
    )
    expect(missing.map((character) => character.hanzi)).toEqual([])
  })

  it.each(exampleFiles.filter((file) => existsSync(file)))('have valid example sentences (%s)', (file) => {
    const set: ExampleSet = JSON.parse(readFileSync(file, 'utf8'))
    expect(validateExampleSet(set, allWords)).toEqual([])
  })

  it('HSK 1-4 is consistent', () => {
    expect(validateDictionaryData(allCharacters, allWords)).toEqual([])
  })
})
