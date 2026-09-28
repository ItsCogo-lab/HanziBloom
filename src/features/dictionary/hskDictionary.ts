import { allCharacters, allWords } from '../../data/index.ts'
import { createDictionary } from './dictionary.ts'

/** El diccionario de la app, construido una sola vez con todo el dataset. */
export const hskDictionary = createDictionary(allCharacters, allWords)
