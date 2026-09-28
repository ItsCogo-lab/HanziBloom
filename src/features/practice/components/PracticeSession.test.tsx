import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { createDictionary } from '../../dictionary/dictionary.ts'
import { testCharacters, testWords } from '../../dictionary/testData.ts'
import type { Exercise } from '../types.ts'
import { PracticeSession } from './PracticeSession.tsx'

const dictionary = createDictionary(testCharacters, testWords)

const exercises: Exercise[] = [
  { type: 'flashcard', item: { kind: 'character', entry: testCharacters[0]! } }, // 你
  { type: 'flashcard', item: { kind: 'word', entry: testWords[2]! } }, // 谢谢
]

function renderSession(onRestart = () => {}) {
  render(
    <MemoryRouter>
      <PracticeSession exercises={exercises} dictionary={dictionary} onRestart={onRestart} />
    </MemoryRouter>,
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

  it('funciona igual con ejercicios de opción múltiple', async () => {
    const user = userEvent.setup()
    const characters = testCharacters.map((entry) => ({ kind: 'character' as const, entry }))
    render(
      <MemoryRouter>
        <PracticeSession
          exercises={[{ type: 'pinyin-choice', item: characters[0]!, options: characters }]} // 你
          dictionary={dictionary}
          onRestart={() => {}}
        />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: 'hǎo' }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    expect(screen.getByText('You knew 0 of 1.')).toBeInTheDocument()
    expect(screen.getByText('你')).toBeInTheDocument()
  })

  it('«Practice again» pide una sesión nueva', async () => {
    const user = userEvent.setup()
    const onRestart = vi.fn()
    renderSession(onRestart)

    await answer(user, 'I knew it')
    await answer(user, 'I knew it')
    expect(screen.getByText('You knew all of them. Great job!')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Practice again' }))
    expect(onRestart).toHaveBeenCalledOnce()
  })
})
