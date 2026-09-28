import { allCharacters, allWords } from '../../data/index.ts'
import { createDictionary } from './dictionary.ts'
import { listStudyItems } from './studyItem.ts'

/** El diccionario de la app, construido una sola vez con todo el dataset. */
export const hskDictionary = createDictionary(allCharacters, allWords)

/** Todos los caracteres y palabras del dataset como elementos de estudio. */
export const hskStudyItems = listStudyItems(hskDictionary)
