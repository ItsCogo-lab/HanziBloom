import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createDictionary } from '../../dictionary/dictionary.ts'
import { testCharacters, testWords } from '../../dictionary/testData.ts'
import type { FlashcardExercise } from '../types.ts'
import { hanzi } from '../../../test/hanzi.ts'
import { renderWithProviders } from '../../../test/renderWithProviders.tsx'
import { Flashcard } from './Flashcard.tsx'

const dictionary = createDictionary(testCharacters, testWords)

const wordExercise: FlashcardExercise = { type: 'flashcard', item: { kind: 'word', entry: testWords[0]! } } // 你好
const characterExercise: FlashcardExercise = {
  type: 'flashcard',
  item: { kind: 'character', entry: testCharacters[1]! }, // 好
}

describe('Flashcard', () => {
  it('muestra el hanzi y oculta la respuesta hasta pulsar «Show answer»', () => {
    renderWithProviders(<Flashcard exercise={wordExercise} dictionary={dictionary} onAnswer={() => {}} onLookUp={() => {}} />)

    expect(screen.getByText('你好')).toBeInTheDocument()
    expect(screen.queryByText('nǐ hǎo')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'I knew it' })).not.toBeInTheDocument()
  })

  it('al revelar muestra pinyin, significado y los caracteres de la palabra', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Flashcard exercise={wordExercise} dictionary={dictionary} onAnswer={() => {}} onLookUp={() => {}} />)

    await user.click(screen.getByRole('button', { name: 'Show answer' }))

    expect(screen.getByText('nǐ hǎo')).toBeInTheDocument()
    expect(screen.getByText('hello')).toBeInTheDocument()
    expect(screen.getByText('Characters')).toBeInTheDocument()
    expect(screen.getByText('Characters').nextElementSibling).toHaveTextContent('你')
    expect(screen.getByRole('group', { name: 'Answer' })).toHaveFocus()
  })

  it('en un carácter muestra las palabras donde aparece', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Flashcard exercise={characterExercise} dictionary={dictionary} onAnswer={() => {}} onLookUp={() => {}} />)

    await user.click(screen.getByRole('button', { name: 'Show answer' }))

    expect(screen.getByText('Appears in')).toBeInTheDocument()
    const related = screen.getByText('Appears in').nextElementSibling as HTMLElement
    expect(related).toHaveTextContent('你好')
    // La palabra 好 es el mismo carácter: no se muestra como relacionada
    expect(within(related).queryByText(hanzi('好'))).not.toBeInTheDocument()
  })

  it.each([
    ['I knew it', true],
    ["I didn't know", false],
  ])('«%s» responde %s', async (buttonName, expected) => {
    const user = userEvent.setup()
    const onAnswer = vi.fn()
    renderWithProviders(<Flashcard exercise={wordExercise} dictionary={dictionary} onAnswer={onAnswer} onLookUp={() => {}} />)

    await user.click(screen.getByRole('button', { name: 'Show answer' }))
    await user.click(screen.getByRole('button', { name: buttonName }))

    expect(onAnswer).toHaveBeenCalledWith(expected)
  })
})
