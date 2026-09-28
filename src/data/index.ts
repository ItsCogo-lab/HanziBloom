import type { Character, Word } from '../features/dictionary/types.ts'
import { hsk1Characters } from './hsk1/characters.ts'
import { hsk1Words } from './hsk1/words.ts'

/*
 * Punto de entrada de los datos. Cuando añadamos HSK 2-4, sus archivos se
 * sumarán aquí y el resto de la app no tendrá que cambiar.
 */

export const allCharacters: readonly Character[] = hsk1Characters

export const allWords: readonly Word[] = hsk1Words
