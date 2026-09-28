import { useReducer, useRef, useState } from 'react'
import { Button } from '../../../components/ui/Button.tsx'
import { ProgressBar } from '../../../components/ui/ProgressBar.tsx'
import { t } from '../../../i18n/index.ts'
import { DictionaryPanel } from '../../dictionary/components/DictionaryPanel.tsx'
import type { Dictionary } from '../../dictionary/dictionary.ts'
import { getStudyItemId, type StudyItem } from '../../dictionary/studyItem.ts'
import {
  createExerciseResult,
  createSessionState,
  getCurrentExercise,
  sessionReducer,
  summarizeResults,
} from '../session.ts'
import type { Exercise, ExerciseResult } from '../types.ts'
import { ExerciseView } from './ExerciseView.tsx'
import { SessionSummary } from './SessionSummary.tsx'

type PracticeSessionProps = {
  exercises: readonly Exercise[]
  dictionary: Dictionary
  /** Lo que se puede buscar en el diccionario de la sesión (todo el dataset). */
  dictionaryItems: readonly StudyItem[]
  /** Se llama con cada respuesta, para guardarla en el progreso al momento. */
  onResult: (result: ExerciseResult) => void
  onRestart: () => void
}

/**
 * Una sesión de práctica: muestra los ejercicios uno a uno y, al terminar,
 * el resumen. Toda la lógica está en session.ts; aquí solo se pinta.
 */
export function PracticeSession({ exercises, dictionary, dictionaryItems, onResult, onRestart }: PracticeSessionProps) {
  const [state, dispatch] = useReducer(sessionReducer, exercises, createSessionState)
  // El diccionario se abre encima de la sesión: el ejercicio sigue montado debajo,
  // con su estado (opción elegida, respuesta revelada), y al cerrar todo sigue igual.
  const [dictionaryOpen, setDictionaryOpen] = useState<{ item?: StudyItem }>()
  const dictionaryButtonRef = useRef<HTMLButtonElement>(null)
  const exercise = getCurrentExercise(state)

  const closeDictionary = () => {
    setDictionaryOpen(undefined)
    dictionaryButtonRef.current?.focus()
  }

  if (!exercise) {
    const missedItems = state.results.flatMap((result, index) =>
      result.correct ? [] : [state.exercises[index]!.item],
    )
    return <SessionSummary summary={summarizeResults(state.results)} missedItems={missedItems} onRestart={onRestart} />
  }

  const current = state.currentIndex + 1
  const total = state.exercises.length

  return (
    // Con el diccionario abierto en escritorio, la sesión se aparta a la izquierda para que se vean los dos
    <div className={dictionaryOpen ? 'md:pr-[28rem]' : undefined}>
      <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-ink-muted" aria-live="polite">
              {t('practice.progress', { current, total })}
            </p>
            <Button
              ref={dictionaryButtonRef}
              variant="secondary"
              className="px-3 py-1.5 text-sm"
              aria-expanded={dictionaryOpen !== undefined}
              onClick={() => (dictionaryOpen ? closeDictionary() : setDictionaryOpen({}))}
            >
              <span aria-hidden="true" className="font-hanzi">
                典
              </span>
              {t('dictionary.panelTitle')}
            </Button>
          </div>
          <ProgressBar value={state.currentIndex} max={total} label={t('practice.progress', { current, total })} />
        </div>
        {/* key: cada ejercicio es un componente nuevo, así su estado (p. ej. «revelado») empieza de cero */}
        <ExerciseView
          key={state.currentIndex}
          exercise={exercise}
          dictionary={dictionary}
          onAnswer={(correct) => {
            onResult(createExerciseResult(exercise, correct))
            dispatch({ type: 'answer', correct })
          }}
          onLookUp={(item) => setDictionaryOpen({ item })}
        />
      </div>
      {dictionaryOpen && (
        <DictionaryPanel
          // key: consultar otro elemento abre su ficha aunque el panel ya estuviera abierto
          key={dictionaryOpen.item ? getStudyItemId(dictionaryOpen.item) : 'search'}
          dictionary={dictionary}
          items={dictionaryItems}
          initialItem={dictionaryOpen.item}
          onClose={closeDictionary}
        />
      )}
    </div>
  )
}
