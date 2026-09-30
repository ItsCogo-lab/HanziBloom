import { useEffect, useId, useRef, useState } from 'react'
import { Button } from '../../../components/ui/Button.tsx'
import { Card } from '../../../components/ui/Card.tsx'
import { Kbd } from '../../../components/ui/Kbd.tsx'
import { t } from '../../../i18n/index.ts'
import { formatPinyin, type Dictionary } from '../../dictionary/dictionary.ts'
import type { StudyItem } from '../../dictionary/studyItem.ts'
import { PinyinText } from '../../dictionary/components/PinyinText.tsx'
import { ToneHanzi } from '../../dictionary/components/ToneHanzi.tsx'
import { getMeaningLabel } from '../choiceExercises.ts'
import { useSessionShortcuts } from '../shortcuts.ts'
import type { WritingExercise as WritingExerciseType } from '../types.ts'
import { gradeWriting, NO_HELP, type WritingHelp } from '../writing.ts'
import { LookUpButtons } from './LookUpButtons.tsx'
import { WritingPad, type WritingPadHandle } from './WritingPad.tsx'

type WritingExerciseProps = {
  exercise: WritingExerciseType
  dictionary: Dictionary
  onAnswer: (correct: boolean) => void
  /** The strokes couldn't be loaded: leave the exercise without counting it. */
  onSkip: () => void
  onLookUp: (item: StudyItem) => void
}

/**
 * Writing exercise: from the meaning and pinyin, the user writes the hanzi
 * one character at a time. Written characters stay in their box. When all
 * are done it is graded (gradeWriting) and the answer is shown, as in a
 * choice question.
 */
export function WritingExercise({ exercise, dictionary, onAnswer, onSkip, onLookUp }: WritingExerciseProps) {
  const { item } = exercise
  const characters = Array.from(item.entry.hanzi)
  // Smaller boxes for words, so two fit side by side on a phone
  const size = characters.length === 1 ? 240 : 150
  const [current, setCurrent] = useState(0)
  const [help, setHelp] = useState<WritingHelp>(NO_HELP)
  const [unavailable, setUnavailable] = useState(false)
  const padRef = useRef<WritingPadHandle>(null)
  const continueRef = useRef<HTMLButtonElement>(null)
  const feedbackId = useId()
  const isDone = current >= characters.length
  const isCorrect = isDone && gradeWriting(help)

  const hint = () => {
    setHelp((previous) => ({ ...previous, hintUsed: true }))
    padRef.current?.hint()
  }
  const reveal = () => {
    setHelp((previous) => ({ ...previous, revealed: true }))
    padRef.current?.reveal()
  }
  const next = () => onAnswer(isCorrect)

  useSessionShortcuts(isDone ? { Enter: next, ' ': next } : unavailable ? {} : { h: hint, H: hint })

  // As in choice questions: on finishing, focus goes to "Continue"
  useEffect(() => {
    if (isDone) continueRef.current?.focus()
  }, [isDone])

  return (
    <Card className="flex flex-col gap-4 sm:gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-sm font-medium tracking-wide text-ink-muted uppercase">
          {t(item.kind === 'character' ? 'practice.kind.character' : 'practice.kind.word')}
        </p>
        <p className="text-2xl font-medium">{getMeaningLabel(item)}</p>
        <PinyinText pinyin={formatPinyin(item.entry)} className="text-lg text-accent-strong" />
        <h2 className="text-lg text-ink-muted">{t('writing.question')}</h2>
      </div>

      <ol aria-label={t('writing.characters')} className="flex flex-wrap justify-center gap-3">
        {characters.map((character, index) => (
          <li key={index}>
            {index <= current ? (
              <WritingPad
                ref={index === current ? padRef : undefined}
                hanzi={character}
                hasLocalCopy={item.entry.hskLevel !== undefined}
                size={size}
                onMistake={(misses) =>
                  setHelp((previous) => ({ ...previous, maxMissesOnStroke: Math.max(previous.maxMissesOnStroke, misses) }))
                }
                onDone={() => setCurrent(index + 1)}
                onUnavailable={() => setUnavailable(true)}
              />
            ) : (
              // Characters still to write: an empty box
              <div aria-hidden="true" className="rounded-xl border border-dashed border-line" style={{ width: size, height: size }} />
            )}
          </li>
        ))}
      </ol>

      {unavailable ? (
        <div className="flex justify-center">
          <Button variant="secondary" onClick={onSkip}>
            {t('writing.skip')}
          </Button>
        </div>
      ) : isDone ? (
        <div className="flex flex-col items-center gap-4 border-t border-line pt-4 text-center">
          <div id={feedbackId}>
            <p className={`text-lg font-semibold ${isCorrect ? 'text-success' : 'text-danger'}`}>
              {t(isCorrect ? 'practice.choice.correct' : help.revealed ? 'writing.revealed' : 'writing.withHelp')}
            </p>
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
            aria-keyshortcuts="Enter"
            className="w-full sm:w-auto"
            onClick={next}
          >
            {t('practice.continue')}
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <Button variant="secondary" aria-keyshortcuts="H" onClick={hint}>
            {t('writing.hint')} <Kbd>H</Kbd>
          </Button>
          <Button variant="secondary" onClick={reveal}>
            {t('writing.showMe')}
          </Button>
        </div>
      )}
    </Card>
  )
}
