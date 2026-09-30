import { useEffect, useId, useRef, useState } from 'react'
import { Button } from '../../../components/ui/Button.tsx'
import { Card } from '../../../components/ui/Card.tsx'
import { Kbd } from '../../../components/ui/Kbd.tsx'
import { t, type MessageKey } from '../../../i18n/index.ts'
import { formatPinyin, type Dictionary } from '../../dictionary/dictionary.ts'
import { getStudyItemId, type StudyItem } from '../../dictionary/studyItem.ts'
import { getMeaningLabel, getPinyinLabel, isCorrectOption } from '../choiceExercises.ts'
import { useSessionShortcuts, type Shortcuts } from '../shortcuts.ts'
import type { ChoiceExercise, ChoiceExerciseType } from '../types.ts'
import { LookUpButtons } from './LookUpButtons.tsx'
import { PinyinText } from '../../dictionary/components/PinyinText.tsx'
import { ToneHanzi } from '../../dictionary/components/ToneHanzi.tsx'

const QUESTIONS: Record<ChoiceExerciseType, MessageKey> = {
  'meaning-choice': 'practice.choice.meaningQuestion',
  'pinyin-choice': 'practice.choice.pinyinQuestion',
  'hanzi-choice': 'practice.choice.hanziQuestion',
}

type ChoiceQuestionProps = {
  exercise: ChoiceExercise
  dictionary: Dictionary
  onAnswer: (correct: boolean) => void
  onLookUp: (item: StudyItem) => void
}

/**
 * Multiple-choice question. Picking an option grades it right away
 * (the correct one in green, the picked one in red if wrong) and shows the
 * full answer; "Continue" moves on to the next exercise.
 */
export function ChoiceQuestion({ exercise, dictionary, onAnswer, onLookUp }: ChoiceQuestionProps) {
  const [selected, setSelected] = useState<StudyItem>()
  const continueRef = useRef<HTMLButtonElement>(null)
  const feedbackId = useId()
  const { type, item, options } = exercise
  const isAnswered = selected !== undefined
  const isCorrect = isAnswered && isCorrectOption(exercise, selected)
  const next = () => onAnswer(isCorrect)
  // Keys 1-4 pick an option; once answered, Enter or Space continue
  const shortcuts: Shortcuts = isAnswered
    ? { Enter: next, ' ': next }
    : Object.fromEntries(options.map((option, index) => [String(index + 1), () => setSelected(option)]))
  useSessionShortcuts(shortcuts)

  // Options are disabled on answering: focus moves to "Continue", which
  // stays in view and carries the feedback as its description for screen
  // readers. This way you can also keep going with the keyboard only.
  useEffect(() => {
    if (isAnswered) continueRef.current?.focus()
  }, [isAnswered])

  return (
    <Card className="flex flex-col gap-4 sm:gap-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-sm font-medium tracking-wide text-ink-muted uppercase">
          {t(item.kind === 'character' ? 'practice.kind.character' : 'practice.kind.word')}
        </p>
        {type === 'hanzi-choice' ? (
          <p className="text-2xl font-medium">{getMeaningLabel(item)}</p>
        ) : (
          // If the question is about pronunciation, tone colors do not appear until answered
          <ToneHanzi
            entry={item.entry}
            showTones={isAnswered || type !== 'pinyin-choice'}
            className="text-7xl leading-tight sm:text-8xl"
          />
        )}
        <h2 className="text-lg text-ink-muted">{t(QUESTIONS[type])}</h2>
      </div>

      <ul aria-label={t('practice.choice.options')} className="grid gap-3 sm:grid-cols-2">
        {options.map((option, index) => (
          <li key={getStudyItemId(option)}>
            <ChoiceOption
              type={type}
              option={option}
              shortcut={String(index + 1)}
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
            {/* The {' '} separate the words when read aloud; the visual gap comes from gap */}
            <p className="mt-2 flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1">
              <ToneHanzi entry={item.entry} className="text-2xl" />{' '}
              <PinyinText pinyin={formatPinyin(item.entry)} className="text-accent-strong" />{' '}
              <span className="text-ink-muted">{getMeaningLabel(item)}</span>
            </p>
          </div>
          <LookUpButtons item={item} dictionary={dictionary} onLookUp={onLookUp} />
          <Button
            ref={continueRef}
            aria-describedby={feedbackId}
            className="w-full sm:w-auto"
            aria-keyshortcuts="Enter"
            onClick={next}
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
  /** Key that picks this option. */
  shortcut: string
  state: OptionState
  disabled: boolean
  onSelect: () => void
}

function ChoiceOption({ type, option, shortcut, state, disabled, onSelect }: ChoiceOptionProps) {
  return (
    <button
      type="button"
      aria-keyshortcuts={shortcut}
      disabled={disabled}
      onClick={onSelect}
      className={`relative flex min-h-14 w-full items-center justify-center gap-2 rounded-xl border-2 px-4 py-2 text-center transition-colors ${OPTION_STATE_CLASSES[state]}`}
    >
      {!disabled && (
        <span className="absolute top-1.5 left-2">
          <Kbd>{shortcut}</Kbd>
        </span>
      )}
      {type === 'hanzi-choice' ? (
        <ToneHanzi entry={option.entry} className="text-3xl" />
      ) : (
        <span className="text-lg">
          {type === 'pinyin-choice' ? <PinyinText pinyin={getPinyinLabel(option)} /> : getMeaningLabel(option)}
        </span>
      )}
      {/* Color is not enough for everyone: also a symbol and a text for screen readers */}
      {state === 'correct' && <OptionMark symbol="✓" label={t('practice.choice.correctOption')} />}
      {state === 'wrong' && <OptionMark symbol="✗" label={t('practice.choice.yourOption')} />}
    </button>
  )
}

function OptionMark({ symbol, label }: { symbol: string; label: string }) {
  return (
    <>
      {/* Without this space, the screen reader would run the text together: "two(correct answer)" */}
      {' '}
      <span aria-hidden="true" className="font-semibold">
        {symbol}
      </span>
      <span className="sr-only">({label})</span>
    </>
  )
}
