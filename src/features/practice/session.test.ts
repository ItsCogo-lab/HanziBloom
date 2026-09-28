import { describe, expect, it } from 'vitest'
import { createDictionary } from '../dictionary/dictionary.ts'
import { listStudyItems } from '../dictionary/studyItem.ts'
import { testCharacters, testWords } from '../dictionary/testData.ts'
import { seededRandom } from '../../test/random.ts'
import type { ExerciseDefinition } from './exerciseDefinitions.ts'
import {
  createSessionExercises,
  createSessionState,
  getCurrentExercise,
  isSessionFinished,
  sessionReducer,
  summarizeResults,
} from './session.ts'
import type { Exercise } from './types.ts'

const pool = listStudyItems(createDictionary(testCharacters, testWords))

describe('createSessionExercises', () => {
  it('crea tantos ejercicios como el tamaño pedido, sin repetir elementos', () => {
    const exercises = createSessionExercises(pool, { size: 5, random: seededRandom(1) })

    expect(exercises).toHaveLength(5)
    expect(new Set(exercises.map((exercise) => exercise.item)).size).toBe(5)
  })

  it('crea menos ejercicios si no hay elementos suficientes', () => {
    expect(createSessionExercises(pool, { size: 100, random: seededRandom(1) })).toHaveLength(pool.length)
  })

  it('con la misma semilla crea la misma sesión', () => {
    const first = createSessionExercises(pool, { size: 4, random: seededRandom(3) })
    const second = createSessionExercises(pool, { size: 4, random: seededRandom(3) })

    expect(first).toEqual(second)
  })

  it('omite los elementos para los que ningún ejercicio se puede construir', () => {
    const onlyWords: ExerciseDefinition = {
      type: 'flashcard',
      canBuild: (item) => item.kind === 'word',
      build: (item) => ({ type: 'flashcard', item }),
    }
    const exercises = createSessionExercises(pool, { size: 100, random: seededRandom(1), definitions: [onlyWords] })

    expect(exercises).toHaveLength(testWords.length)
    expect(exercises.every((exercise) => exercise.item.kind === 'word')).toBe(true)
  })
})

describe('sessionReducer', () => {
  const exercises: Exercise[] = pool.slice(0, 2).map((item) => ({ type: 'flashcard', item }))

  it('al responder, guarda el resultado y pasa al siguiente ejercicio', () => {
    const state = sessionReducer(createSessionState(exercises), { type: 'answer', correct: true })

    expect(state.currentIndex).toBe(1)
    expect(state.results).toEqual([{ itemId: 'char:你', exerciseType: 'flashcard', correct: true }])
    expect(getCurrentExercise(state)).toBe(exercises[1])
  })

  it('termina cuando se han respondido todos los ejercicios', () => {
    let state = createSessionState(exercises)
    state = sessionReducer(state, { type: 'answer', correct: true })
    expect(isSessionFinished(state)).toBe(false)

    state = sessionReducer(state, { type: 'answer', correct: false })
    expect(isSessionFinished(state)).toBe(true)
    expect(getCurrentExercise(state)).toBeUndefined()
  })

  it('ignora respuestas cuando la sesión ya ha terminado', () => {
    const finished = { ...createSessionState(exercises), currentIndex: 2 }

    expect(sessionReducer(finished, { type: 'answer', correct: true })).toBe(finished)
  })
})

describe('summarizeResults', () => {
  it('cuenta aciertos y fallos', () => {
    const summary = summarizeResults([
      { itemId: 'char:你', exerciseType: 'flashcard', correct: true },
      { itemId: 'word:好', exerciseType: 'flashcard', correct: false },
      { itemId: 'word:谢谢', exerciseType: 'flashcard', correct: true },
    ])

    expect(summary).toEqual({ total: 3, correct: 2, wrong: 1 })
  })

  it('funciona con una sesión vacía', () => {
    expect(summarizeResults([])).toEqual({ total: 0, correct: 0, wrong: 0 })
  })
})
