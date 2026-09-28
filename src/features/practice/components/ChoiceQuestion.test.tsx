import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { StudyItem } from '../../dictionary/studyItem.ts'
import type { ChoiceExercise, ChoiceExerciseType } from '../types.ts'
import { ChoiceQuestion } from './ChoiceQuestion.tsx'

function character(hanzi: string, pinyin: string, meaning: string): StudyItem {
  return { kind: 'character', entry: { id: hanzi, hanzi, pinyin: [pinyin], meanings: { en: [meaning] }, hskLevel: 1 } }
}

const [one, two, three, four] = [
  character('一', 'yī', 'one'),
  character('二', 'èr', 'two'),
  character('三', 'sān', 'three'),
  character('四', 'sì', 'four'),
] as const

function exerciseOf(type: ChoiceExerciseType): ChoiceExercise {
  return { type, item: two, options: [one, two, three, four] }
}

function renderQuestion(type: ChoiceExerciseType, onAnswer = vi.fn()) {
  render(<ChoiceQuestion exercise={exerciseOf(type)} onAnswer={onAnswer} />)
  return onAnswer
}

function getOptions() {
  return within(screen.getByRole('list', { name: 'Options' })).getAllByRole('button')
}

describe('ChoiceQuestion', () => {
  it('meaning-choice: muestra el hanzi y los significados como opciones', () => {
    renderQuestion('meaning-choice')

    expect(screen.getByText('二')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'What does it mean?' })).toBeInTheDocument()
    expect(getOptions().map((option) => option.textContent)).toEqual(['one', 'two', 'three', 'four'])
  })

  it('pinyin-choice: las opciones son pinyin', () => {
    renderQuestion('pinyin-choice')

    expect(screen.getByRole('heading', { name: 'How is it pronounced?' })).toBeInTheDocument()
    expect(getOptions().map((option) => option.textContent)).toEqual(['yī', 'èr', 'sān', 'sì'])
  })

  it('hanzi-choice: muestra el significado y los hanzi como opciones', () => {
    renderQuestion('hanzi-choice')

    expect(screen.getByText('two')).toBeInTheDocument()
    // El hanzi solo aparece en las opciones, no en la pregunta
    expect(screen.getAllByText('二')).toHaveLength(1)
    expect(getOptions().map((option) => option.textContent)).toEqual(['一', '二', '三', '四'])
  })

  it('al acertar lo dice, marca la opción y «Continue» responde true', async () => {
    const user = userEvent.setup()
    const onAnswer = renderQuestion('meaning-choice')

    await user.click(screen.getByRole('button', { name: 'two' }))

    // El foco pasa a «Continue», que lleva la corrección como descripción
    const continueButton = screen.getByRole('button', { name: 'Continue' })
    expect(continueButton).toHaveFocus()
    expect(continueButton).toHaveAccessibleDescription('Correct! 二 èr two')
    expect(screen.getByRole('button', { name: 'two (correct answer)' })).toBeDisabled()
    expect(onAnswer).not.toHaveBeenCalled()

    await user.keyboard('{Enter}')
    expect(onAnswer).toHaveBeenCalledWith(true)
  })

  it('al fallar marca la elegida y la correcta, y «Continue» responde false', async () => {
    const user = userEvent.setup()
    const onAnswer = renderQuestion('meaning-choice')

    await user.click(screen.getByRole('button', { name: 'four' }))

    expect(screen.getByText('Not quite')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'four (your answer)' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'two (correct answer)' })).toBeInTheDocument()
    // No se puede cambiar la respuesta
    expect(getOptions().every((option) => option.hasAttribute('disabled'))).toBe(true)

    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(onAnswer).toHaveBeenCalledWith(false)
  })
})
