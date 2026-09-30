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
  /** Called with each answer, to save it to progress right away. */
  onResult: (result: ExerciseResult) => void
  onRestart: () => void
}

/**
 * A practice session: shows the exercises one by one and, at the end, the
 * summary. All the logic lives in session.ts; this only renders.
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
        // key: each exercise is a new component, so its state (e.g. "revealed") starts from scratch
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
