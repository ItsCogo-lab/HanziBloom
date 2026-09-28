import { useEffect, useId, useRef, useState } from 'react'
import { Button } from '../../../components/ui/Button.tsx'
import { Card } from '../../../components/ui/Card.tsx'
import { t, type MessageKey } from '../../../i18n/index.ts'
import { formatPinyin } from '../../dictionary/dictionary.ts'
import { getStudyItemId, type StudyItem } from '../../dictionary/studyItem.ts'
import { getMeaningLabel, getPinyinLabel, isCorrectOption } from '../choiceExercises.ts'
import type { ChoiceExercise, ChoiceExerciseType } from '../types.ts'
import { HanziText } from './HanziText.tsx'

const QUESTIONS: Record<ChoiceExerciseType, MessageKey> = {
  'meaning-choice': 'practice.choice.meaningQuestion',
  'pinyin-choice': 'practice.choice.pinyinQuestion',
  'hanzi-choice': 'practice.choice.hanziQuestion',
}

type ChoiceQuestionProps = {
  exercise: ChoiceExercise
  onAnswer: (correct: boolean) => void
}

/**
 * Pregunta de opción múltiple. Al elegir una opción se corrige al momento
 * (la correcta en verde, la elegida en rojo si falla) y se muestra la
 * respuesta completa; «Continue» pasa al siguiente ejercicio.
 */
export function ChoiceQuestion({ exercise, onAnswer }: ChoiceQuestionProps) {
  const [selected, setSelected] = useState<StudyItem>()
  const continueRef = useRef<HTMLButtonElement>(null)
  const feedbackId = useId()
  const { type, item, options } = exercise
  const isAnswered = selected !== undefined
  const isCorrect = isAnswered && isCorrectOption(exercise, selected)

  // Las opciones se desactivan al responder: el foco pasa a «Continue», que
  // queda a la vista y lleva la corrección como descripción para los lectores
  // de pantalla. Así también se puede seguir solo con el teclado.
  useEffect(() => {
    if (isAnswered) continueRef.current?.focus()
  }, [isAnswered])

  return (
    <Card className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-sm font-medium tracking-wide text-ink-muted uppercase">
          {t(item.kind === 'character' ? 'practice.kind.character' : 'practice.kind.word')}
        </p>
        {type === 'hanzi-choice' ? (
          <p className="text-2xl font-medium">{getMeaningLabel(item)}</p>
        ) : (
          <HanziText className="text-7xl leading-tight sm:text-8xl">{item.entry.hanzi}</HanziText>
        )}
        <h2 className="text-lg text-ink-muted">{t(QUESTIONS[type])}</h2>
      </div>

      <ul aria-label={t('practice.choice.options')} className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => (
          <li key={getStudyItemId(option)}>
            <ChoiceOption
              type={type}
              option={option}
              state={getOptionState(exercise, option, selected)}
              disabled={isAnswered}
              onSelect={() => setSelected(option)}
            />
          </li>
        ))}
      </ul>

      {isAnswered && (
        <div className="flex flex-col items-center gap-4 border-t border-line pt-4 text-center">
          <div id={feedbackId}>
            <p className={`text-lg font-semibold ${isCorrect ? 'text-success' : 'text-danger'}`}>
              {t(isCorrect ? 'practice.choice.correct' : 'practice.choice.incorrect')}
            </p>
            {/* Los {' '} separan las palabras al leerlo en voz alta; el hueco visual lo pone gap */}
            <p className="mt-2 flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1">
              <HanziText className="text-2xl">{item.entry.hanzi}</HanziText>{' '}
              <span className="text-accent-strong">{formatPinyin(item.entry)}</span>{' '}
              <span className="text-ink-muted">{getMeaningLabel(item)}</span>
            </p>
          </div>
          <Button
            ref={continueRef}
            aria-describedby={feedbackId}
            className="w-full sm:w-auto"
            onClick={() => onAnswer(isCorrect)}
          >
            {t('practice.continue')}
          </Button>
        </div>
      )}
    </Card>
  )
}

type OptionState = 'idle' | 'correct' | 'wrong' | 'other'

function getOptionState(exercise: ChoiceExercise, option: StudyItem, selected: StudyItem | undefined): OptionState {
  if (selected === undefined) return 'idle'
  if (isCorrectOption(exercise, option)) return 'correct'
  return option === selected ? 'wrong' : 'other'
}

const OPTION_STATE_CLASSES: Record<OptionState, string> = {
  idle: 'border-line bg-surface hover:border-accent hover:bg-accent-soft',
  correct: 'border-success bg-success/10',
  wrong: 'border-danger bg-danger/10',
  other: 'border-line bg-surface text-ink-muted',
}

type ChoiceOptionProps = {
  type: ChoiceExerciseType
  option: StudyItem
  state: OptionState
  disabled: boolean
  onSelect: () => void
}

function ChoiceOption({ type, option, state, disabled, onSelect }: ChoiceOptionProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={`flex min-h-14 w-full items-center justify-center gap-2 rounded-xl border-2 px-4 py-2 text-center transition-colors ${OPTION_STATE_CLASSES[state]}`}
    >
      {type === 'hanzi-choice' ? (
        <HanziText className="text-3xl">{option.entry.hanzi}</HanziText>
      ) : (
        <span className="text-lg">{type === 'pinyin-choice' ? getPinyinLabel(option) : getMeaningLabel(option)}</span>
      )}
      {/* El color no basta para todo el mundo: también un símbolo y un texto para lectores de pantalla */}
      {state === 'correct' && <OptionMark symbol="✓" label={t('practice.choice.correctOption')} />}
      {state === 'wrong' && <OptionMark symbol="✗" label={t('practice.choice.yourOption')} />}
    </button>
  )
}

function OptionMark({ symbol, label }: { symbol: string; label: string }) {
  return (
    <>
      {/* Sin este espacio, el lector de pantalla juntaría el texto: «two(correct answer)» */}
      {' '}
      <span aria-hidden="true" className="font-semibold">
        {symbol}
      </span>
      <span className="sr-only">({label})</span>
    </>
  )
}
