import { useReducer } from 'react'
import { t } from '../../../i18n/index.ts'
import type { Dictionary } from '../../dictionary/dictionary.ts'
import {
  createExerciseResult,
  createSessionState,
  getCurrentExercise,
  sessionReducer,
  summarizeResults,
} from '../session.ts'
import type { Exercise, ExerciseResult } from '../types.ts'
import { ExerciseView } from './ExerciseView.tsx'
import { SessionFrame } from './SessionFrame.tsx'
import { SessionSummary } from './SessionSummary.tsx'

type PracticeSessionProps = {
  exercises: readonly Exercise[]
  dictionary: Dictionary
  /** Se llama con cada respuesta, para guardarla en el progreso al momento. */
  onResult: (result: ExerciseResult) => void
  onRestart: () => void
}

/**
 * Una sesión de práctica: muestra los ejercicios uno a uno y, al terminar,
 * el resumen. Toda la lógica está en session.ts; aquí solo se pinta.
 */
export function PracticeSession({ exercises, dictionary, onResult, onRestart }: PracticeSessionProps) {
  const [state, dispatch] = useReducer(sessionReducer, exercises, createSessionState)
  const exercise = getCurrentExercise(state)

  if (!exercise) {
    const missedItems = state.results.flatMap((result, index) =>
      result.correct ? [] : [state.exercises[index]!.item],
    )
    return <SessionSummary summary={summarizeResults(state.results)} missedItems={missedItems} onRestart={onRestart} />
  }

  const current = state.currentIndex + 1
  const total = state.exercises.length

  return (
    <SessionFrame
      progressText={t('practice.progress', { current, total })}
      value={state.currentIndex}
      max={total}
    >
      {(lookUp) => (
        // key: cada ejercicio es un componente nuevo, así su estado (p. ej. «revelado») empieza de cero
        <ExerciseView
          key={state.currentIndex}
          exercise={exercise}
          dictionary={dictionary}
          onAnswer={(correct) => {
            onResult(createExerciseResult(exercise, correct))
            dispatch({ type: 'answer', correct })
          }}
          onLookUp={lookUp}
        />
      )}
    </SessionFrame>
  )
}
