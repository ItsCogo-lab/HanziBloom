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
 * Entry point for the data (HSK 2.0, levels 1 to 4). Each level has its own
 * generated files; the rest of the app only uses these two lists.
 */

export const allCharacters: readonly Character[] = [
  ...hsk1Characters,
  ...hsk2Characters,
  ...hsk3Characters,
  ...hsk4Characters,
]

export const allWords: readonly Word[] = [...hsk1Words, ...hsk2Words, ...hsk3Words, ...hsk4Words]
