import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { allCharacters, allWords } from '../../src/data/index.ts'
import { strokeFileName } from '../../src/features/dictionary/strokes.ts'
import type { ExampleSet } from '../../src/features/dictionary/types.ts'
import { validateExampleSet } from '../../src/features/dictionary/validation.ts'

/* Los archivos generados en public/ que carga la ficha. Lo mismo que `npm run data:validate`. */

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
})
