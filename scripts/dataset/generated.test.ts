import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { allCharacters, allWords } from '../../src/data/index.ts'
import { strokeFileName } from '../../src/features/dictionary/strokes.ts'
import type { ExampleSet } from '../../src/features/dictionary/types.ts'
import {
  validateDictionaryData,
  validateExampleSet,
  validateFullDictionary,
} from '../../src/features/dictionary/validation.ts'
import { readFullDictionary } from './fullDictionaryFiles.ts'

/* Los archivos generados en public/ que carga la app. Lo mismo que `npm run data:validate`. */

const publicDir = join(dirname(fileURLToPath(import.meta.url)), '../../public')
const exampleFiles = [1, 2, 3, 4].map((level) => join(publicDir, `examples/hsk${level}.json`))

describe('archivos generados en public/', () => {
  it('tienen los trazos de cada carácter', () => {
    const missing = allCharacters.filter(
      (character) => !existsSync(join(publicDir, 'strokes', strokeFileName(character.hanzi))),
    )
    expect(missing.map((character) => character.hanzi)).toEqual([])
  })

  it.each(exampleFiles.filter((file) => existsSync(file)))('tienen frases de ejemplo válidas (%s)', (file) => {
    const set: ExampleSet = JSON.parse(readFileSync(file, 'utf8'))
    expect(validateExampleSet(set, allWords)).toEqual([])
  })

  it('tienen el diccionario completo, coherente con HSK 1-4', () => {
    const chunks = readFullDictionary(join(publicDir, 'dictionary'))
    const characters = chunks.flatMap((chunk) => chunk.characters)
    const words = chunks.flatMap((chunk) => chunk.words)
    expect(validateFullDictionary(chunks)).toEqual([])
    expect(validateDictionaryData([...allCharacters, ...characters], [...allWords, ...words])).toEqual([])
    // Mucho más que HSK 1-4: todo CC-CEDICT escrito con caracteres chinos
    expect(words.length).toBeGreaterThan(100_000)
  })
})
