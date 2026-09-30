import { allCharacters, allWords } from '../../data/index.ts'
import { createDictionary } from './dictionary.ts'
import { listStudyItems } from './studyItem.ts'

/** The app's dictionary, built once from the whole dataset. */
export const hskDictionary = createDictionary(allCharacters, allWords)

/** All characters and words in the dataset as study items. */
export const hskStudyItems = listStudyItems(hskDictionary)
