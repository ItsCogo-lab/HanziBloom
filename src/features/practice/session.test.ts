import { describe, expect, it } from 'vitest'
import { createDictionary } from '../dictionary/dictionary.ts'
import { getStudyItemId, listStudyItems, type StudyItem } from '../dictionary/studyItem.ts'
import { testCharacters, testWords } from '../dictionary/testData.ts'
import { seededRandom } from '../../test/random.ts'
import type { ExerciseDefinition } from './exerciseDefinitions.ts'
import { applyHskLevel, createEmptyProgress, recordAnswer } from '../progress/progress.ts'
import {
  createSessionExercises,
  createSessionState,
  getCurrentExercise,
  isSessionFinished,
  selectSessionItems,
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

describe('selectSessionItems', () => {
  const monday = new Date(2026, 8, 28, 10, 0)
  const thursday = new Date(2026, 9, 1, 10, 0)
  const ids = (items: readonly StudyItem[]) => items.map(getStudyItemId).toSorted()

  // 你 y 好 se fallaron (pendientes ya); 谢 y 了 se acertaron (pendientes desde mañana)
  let progress = createEmptyProgress()
  for (const [id, correct] of [
    ['char:你', false],
    ['char:好', false],
    ['char:谢', true],
    ['char:了', true],
  ] as const) {
    progress = recordAnswer(progress, id, correct, monday)
  }

  it('pone primero los repasos pendientes', () => {
    expect(ids(selectSessionItems(pool, progress, monday, 2, seededRandom(1)))).toEqual(['char:你', 'char:好'])
  })

  it('después los elementos nuevos', () => {
    expect(ids(selectSessionItems(pool, progress, monday, 5, seededRandom(1)))).toEqual(
      ['char:你', 'char:好', 'word:你好', 'word:好', 'word:谢谢'].toSorted(),
    )
  })

  it('y, si faltan, los que aún no tocaban', () => {
    expect(selectSessionItems(pool, progress, monday, 100, seededRandom(1))).toHaveLength(pool.length)
  })

  it('los básicos nunca son pendientes y van detrás de todo lo demás', () => {
    // 你 era un fallo pendiente, pero con HSK 3 pasa a básico
    const withBasic = applyHskLevel(progress, [{ itemId: 'char:你', hskLevel: 1 }], 3, monday)
    const items = pool.filter((item) => withBasic.items[getStudyItemId(item)] !== undefined)

    expect(ids(selectSessionItems(items, withBasic, thursday, 3, seededRandom(1)))).toEqual(
      ['char:好', 'char:谢', 'char:了'].toSorted(),
    )
  })

  it('cuando llega su fecha, los acertados también son repasos pendientes', () => {
    expect(ids(selectSessionItems(pool, progress, thursday, 4, seededRandom(1)))).toEqual(
      ['char:你', 'char:好', 'char:谢', 'char:了'].toSorted(),
    )
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
