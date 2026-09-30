import { topicDefinitions } from '../../data/topics.ts'
import { hskDictionary } from '../dictionary/hskDictionary.ts'
import { createStudySets } from './studySets.ts'

/** The app's sets, built once from the dataset. */
export const appStudySets = createStudySets(hskDictionary, topicDefinitions)
