import type { Character, Word } from '../features/dictionary/types.ts'
import { hsk1Characters } from './hsk1/characters.ts'
import { hsk1Words } from './hsk1/words.ts'
import { hsk2Characters } from './hsk2/characters.ts'
import { hsk2Words } from './hsk2/words.ts'
import { hsk3Characters } from './hsk3/characters.ts'
import { hsk3Words } from './hsk3/words.ts'
import { hsk4Characters } from './hsk4/characters.ts'
import { hsk4Words } from './hsk4/words.ts'

/*
 * Punto de entrada de los datos (HSK 2.0, niveles 1 a 4). Cada nivel tiene
 * sus archivos generados; el resto de la app solo usa estas dos listas.
 */

export const allCharacters: readonly Character[] = [
  ...hsk1Characters,
  ...hsk2Characters,
  ...hsk3Characters,
  ...hsk4Characters,
]

export const allWords: readonly Word[] = [...hsk1Words, ...hsk2Words, ...hsk3Words, ...hsk4Words]
