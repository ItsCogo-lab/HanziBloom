import { topicDefinitions } from '../../data/topics.ts'
import { hskDictionary } from '../dictionary/hskDictionary.ts'
import { createStudySets } from './studySets.ts'

/** Los sets de la app, construidos una sola vez con el dataset. */
export const appStudySets = createStudySets(hskDictionary, topicDefinitions)
