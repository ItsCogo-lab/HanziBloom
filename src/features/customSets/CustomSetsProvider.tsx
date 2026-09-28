import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { KeyValueStorage } from '../../lib/storage.ts'
import { hskDictionary } from '../dictionary/hskDictionary.ts'
import { getStudyItem } from '../dictionary/studyItem.ts'
import {
  addItem,
  createCustomSet,
  createCustomSetId,
  deleteCustomSet,
  deleteMeaning,
  removeItem,
  setMeaning,
  updateCustomSet,
} from './customSets.ts'
import { addSentence, createSentence, createSentenceId, deleteSentence, updateSentence } from './sentences.ts'
import { CustomSetsContext, type CustomSetsContextValue } from './customSetsContext.ts'
import { loadCustomSets, saveCustomSets } from './storage.ts'

type CustomSetsProviderProps = {
  children: ReactNode
  storage?: KeyValueStorage
}

/**
 * Igual que ProgressProvider: carga al arrancar y guarda en cada cambio. Es
 * el único sitio que sabe dónde se guardan los sets: cambiarlo por un
 * servidor no afectaría a las páginas.
 */
export function CustomSetsProvider({ children, storage }: CustomSetsProviderProps) {
  const [customSets, setCustomSets] = useState(() => loadCustomSets(storage))

  useEffect(() => {
    saveCustomSets(customSets, storage)
  }, [customSets, storage])

  const value = useMemo<CustomSetsContextValue>(() => {
    const update = (setId: string, change: Parameters<typeof updateCustomSet>[3]) =>
      setCustomSets((current) => updateCustomSet(current, setId, new Date(), change))
    return {
      customSets,
      createSet: (details) => {
        const id = createCustomSetId()
        setCustomSets((current) => [...current, createCustomSet(details, id, new Date())])
        return id
      },
      updateDetails: (setId, details) => update(setId, (set) => ({ ...set, ...details })),
      deleteSet: (setId) => setCustomSets((current) => deleteCustomSet(current, setId)),
      // Solo se añaden elementos que existen en el diccionario
      addItem: (setId, itemId) => {
        if (getStudyItem(hskDictionary, itemId)) update(setId, (set) => addItem(set, itemId))
      },
      removeItem: (setId, itemId) => update(setId, (set) => removeItem(set, itemId)),
      setMeaning: (setId, itemId, meaning) => update(setId, (set) => setMeaning(set, itemId, meaning)),
      deleteMeaning: (setId, itemId) => update(setId, (set) => deleteMeaning(set, itemId)),
      addSentence: (setId, input) => {
        const now = new Date()
        update(setId, (set) => addSentence(set, createSentence(input, createSentenceId(), now)))
      },
      updateSentence: (setId, sentenceId, change) =>
        update(setId, (set) => updateSentence(set, sentenceId, new Date(), change)),
      deleteSentence: (setId, sentenceId) => update(setId, (set) => deleteSentence(set, sentenceId)),
    }
  }, [customSets])

  return <CustomSetsContext value={value}>{children}</CustomSetsContext>
}
