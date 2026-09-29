import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createDictionary } from '../../dictionary/dictionary.ts'
import { testCharacters, testWords } from '../../dictionary/testData.ts'
import type { Exercise } from '../types.ts'
import { hanzi } from '../../../test/hanzi.ts'
import { renderWithProviders } from '../../../test/renderWithProviders.tsx'
import { PracticeSession } from './PracticeSession.tsx'

const dictionary = createDictionary(testCharacters, testWords)

const exercises: Exercise[] = [
  { type: 'flashcard', item: { kind: 'character', entry: testCharacters[0]! } }, // 你
  { type: 'flashcard', item: { kind: 'word', entry: testWords[2]! } }, // 谢谢
]

function renderSession({ onRestart = () => {}, onResult = () => {}, sessionExercises = exercises } = {}) {
  renderWithProviders(
    <PracticeSession
      exercises={sessionExercises}
      dictionary={dictionary}
      onResult={onResult}
      onRestart={onRestart}
    />,
  )
}

async function answer(user: ReturnType<typeof userEvent.setup>, buttonName: string) {
  await user.click(screen.getByRole('button', { name: 'Show answer' }))
  await user.click(screen.getByRole('button', { name: buttonName }))
}

describe('PracticeSession', () => {
  it('muestra los ejercicios uno a uno con el progreso', async () => {
    const user = userEvent.setup()
    renderSession()

    expect(screen.getByText('Card 1 of 2')).toBeInTheDocument()
    expect(screen.getByText('你')).toBeInTheDocument()

    await answer(user, 'I knew it')

    expect(screen.getByText('Card 2 of 2')).toBeInTheDocument()
    expect(screen.getByText('谢谢')).toBeInTheDocument()
    // La tarjeta nueva empieza sin revelar
    expect(screen.getByRole('button', { name: 'Show answer' })).toBeInTheDocument()
  })

  it('al terminar muestra el resumen con lo que hay que repasar', async () => {
    const user = userEvent.setup()
    renderSession()

    await answer(user, 'I knew it')
    await answer(user, "I didn't know")

    expect(screen.getByRole('heading', { name: 'Session complete' })).toBeInTheDocument()
    expect(screen.getByText('You knew 1 of 2.')).toBeInTheDocument()
    expect(screen.getByText('To review')).toBeInTheDocument()
    expect(screen.getByText('谢谢')).toBeInTheDocument()
    expect(screen.queryByText('你')).not.toBeInTheDocument()
  })

  it('avisa de cada respuesta en cuanto se da, para guardarla', async () => {
    const user = userEvent.setup()
    const onResult = vi.fn()
    renderSession({ onResult })

    await answer(user, "I didn't know")
    expect(onResult).toHaveBeenLastCalledWith({ itemId: 'char:你', exerciseType: 'flashcard', correct: false })

    await answer(user, 'I knew it')
    expect(onResult).toHaveBeenLastCalledWith({ itemId: 'word:谢谢', exerciseType: 'flashcard', correct: true })
    expect(onResult).toHaveBeenCalledTimes(2)
  })

  it('funciona igual con ejercicios de opción múltiple', async () => {
    const user = userEvent.setup()
    const characters = testCharacters.map((entry) => ({ kind: 'character' as const, entry }))
    renderSession({ sessionExercises: [{ type: 'pinyin-choice', item: characters[0]!, options: characters }] }) // 你

    await user.click(screen.getByRole('button', { name: 'hǎo' }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    expect(screen.getByText('You knew 0 of 1.')).toBeInTheDocument()
    expect(screen.getByText('你')).toBeInTheDocument()
  })

  it('«Practice again» pide una sesión nueva', async () => {
    const user = userEvent.setup()
    const onRestart = vi.fn()
    renderSession({ onRestart })

    await answer(user, 'I knew it')
    await answer(user, 'I knew it')
    expect(screen.getByText('You knew all of them. Great job!')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Practice again' }))
    expect(onRestart).toHaveBeenCalledOnce()
  })
})

describe('PracticeSession: diccionario sin salir de la sesión', () => {
  beforeEach(() => {
    // Las fichas piden trazos y frases al abrirse; aquí no hay servidor
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 404 })))
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function getPanel() {
    return screen.getByRole('dialog', { name: 'Dictionary' })
  }

  it('abre el diccionario, busca un carácter y al cerrar sigue en la misma tarjeta', async () => {
    const user = userEvent.setup()
    renderSession()
    await answer(user, 'I knew it') // pasa a la tarjeta 2: 谢谢
    await user.click(screen.getByRole('button', { name: 'Show answer' }))

    await user.click(screen.getByRole('button', { name: 'Dictionary' }))
    const search = within(getPanel()).getByRole('searchbox', { name: 'Search' })
    expect(search).toHaveFocus()

    await user.type(search, '你')
    const results = within(getPanel()).getByRole('list', { name: 'Results' })
    await user.click(within(results).getAllByRole('button')[0]!)
    // La ficha se abre dentro del panel, sin cambiar de página
    expect(within(getPanel()).getByRole('heading', { name: 'Meanings' })).toBeInTheDocument()
    expect(within(getPanel()).getByText(hanzi('你'), { selector: '.text-7xl' })).toBeInTheDocument()

    await user.click(within(getPanel()).getByRole('button', { name: 'Close' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    // La sesión sigue exactamente igual: tarjeta 2, con la respuesta revelada
    expect(screen.getByText('Card 2 of 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'I knew it' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Dictionary' })).toHaveFocus()
  })

  it('consulta un carácter de la respuesta y al cerrar con Escape la respuesta elegida sigue ahí', async () => {
    const user = userEvent.setup()
    const onResult = vi.fn()
    const characters = testCharacters.map((entry) => ({ kind: 'character' as const, entry }))
    renderSession({ onResult, sessionExercises: [{ type: 'meaning-choice', item: characters[2]!, options: characters }] }) // 谢

    await user.click(screen.getByRole('button', { name: 'good; well' })) // respuesta incorrecta
    expect(screen.getByText('Not quite')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Look up 谢 in the dictionary' }))
    expect(within(getPanel()).getByRole('heading', { name: 'Meanings' })).toBeInTheDocument()
    // Desde la ficha se puede seguir a otra (谢 → 谢谢) sin salir del panel
    await user.click(within(getPanel()).getByRole('button', { name: /谢谢/ }))
    expect(within(getPanel()).getByText('thanks')).toBeInTheDocument()
    await user.click(within(getPanel()).getByRole('button', { name: 'Back' }))
    // El panel usa el diccionario de la app: 谢 «to thank» y, entre sus palabras, 谢谢
    expect(within(getPanel()).getAllByText('to thank')[0]).toBeInTheDocument()

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('Not quite')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /good; well/ })).toBeDisabled()
    // Consultar no cuenta como respuesta: solo se guarda al pulsar Continue
    expect(onResult).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(onResult).toHaveBeenCalledWith({ itemId: 'char:谢', exerciseType: 'meaning-choice', correct: false })
  })

  it('no ofrece consultar el elemento antes de responder, para no dar la respuesta', () => {
    renderSession()
    expect(screen.queryByRole('button', { name: /^Look up/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Dictionary' })).toBeInTheDocument()
  })

  it('en una palabra ofrece consultar la palabra y cada carácter', async () => {
    const user = userEvent.setup()
    renderSession({ sessionExercises: [{ type: 'flashcard', item: { kind: 'word', entry: testWords[0]! } }] }) // 你好
    await user.click(screen.getByRole('button', { name: 'Show answer' }))

    for (const target of ['你好', '你', '好']) {
      expect(screen.getByRole('button', { name: `Look up ${target} in the dictionary` })).toBeInTheDocument()
    }
  })
})
