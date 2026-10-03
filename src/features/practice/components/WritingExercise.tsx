import { useEffect, useId, useRef, useState } from 'react'
import { Button } from '../../../components/ui/Button.tsx'
import { Card } from '../../../components/ui/Card.tsx'
import { HanziText } from '../../../components/ui/HanziText.tsx'
import { Kbd } from '../../../components/ui/Kbd.tsx'
import { t } from '../../../i18n/index.ts'
import { formatPinyin, type Dictionary } from '../../dictionary/dictionary.ts'
import type { StudyItem } from '../../dictionary/studyItem.ts'
import { PinyinText } from '../../dictionary/components/PinyinText.tsx'
import { ToneHanzi } from '../../dictionary/components/ToneHanzi.tsx'
import { getMeaningLabel } from '../choiceExercises.ts'
import { useSessionShortcuts } from '../shortcuts.ts'
import type { WritingExercise as WritingExerciseType } from '../types.ts'
import { useElementWidth } from '../useElementWidth.ts'
import { gradeWriting, NO_HELP, type WritingHelp } from '../writing.ts'
import { LookUpButtons } from './LookUpButtons.tsx'
import { WritingPad, type WritingPadHandle } from './WritingPad.tsx'

/** Below this width (a phone in portrait) only the character being written gets a pad, as big as fits. */
const NARROW_WIDTH = 560
const MAX_NARROW_PAD = 360

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
 * choice question. With `only`, a single character of the word is written
 * and the others are shown.
 */
export function WritingExercise({ exercise, dictionary, onAnswer, onSkip, onLookUp }: WritingExerciseProps) {
  const { item, only } = exercise
  const characters = Array.from(item.entry.hanzi)
  // Indexes of the characters to write, in order
  const targets = only === undefined ? characters.map((_, index) => index) : [only]
  const padsRef = useRef<HTMLDivElement>(null)
  const width = useElementWidth(padsRef)
  const isNarrow = width !== undefined && width < NARROW_WIDTH
  // How many of the targets are written
  const [written, setWritten] = useState(0)
  const [help, setHelp] = useState<WritingHelp>(NO_HELP)
  const [unavailable, setUnavailable] = useState(false)
  const padRef = useRef<WritingPadHandle>(null)
  const continueRef = useRef<HTMLButtonElement>(null)
  const feedbackId = useId()
  const isDone = written >= targets.length
  const isCorrect = isDone && gradeWriting(help)
  // The character being written; once all are, the last one stays on screen drawn
  const shown = targets[Math.min(written, targets.length - 1)]!
  const boxState = (index: number): BoxState => {
    const position = targets.indexOf(index)
    if (position === -1) return 'given'
    return position < written ? 'written' : position === written ? 'current' : 'pending'
  }

  const hint = () => {
    setHelp((previous) => ({ ...previous, hintUsed: true }))
    padRef.current?.hint()
  }
  const reveal = () => {
    setHelp((previous) => ({ ...previous, revealed: true }))
    padRef.current?.reveal()
  }
  const next = () => onAnswer(isCorrect)
  const onMistake = (misses: number) =>
    setHelp((previous) => ({ ...previous, maxMissesOnStroke: Math.max(previous.maxMissesOnStroke, misses) }))
  const hasLocalCopy = item.entry.hskLevel !== undefined
  // On wider screens all the boxes sit side by side, smaller for words
  const wideSize = characters.length === 1 ? 240 : 150

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
        <h2 className="text-lg text-ink-muted">{t(only === undefined ? 'writing.question' : 'writing.questionOne')}</h2>
      </div>

      <div ref={padsRef}>
        {isNarrow ? (
          <div className="flex flex-col items-center gap-3">
            {characters.length > 1 && <CharacterProgress characters={characters} boxState={boxState} />}
            <WritingPad
              key={shown}
              ref={padRef}
              hanzi={characters[shown]!}
              hasLocalCopy={hasLocalCopy}
              size={Math.min(width, MAX_NARROW_PAD)}
              onMistake={onMistake}
              onDone={() => setWritten((previous) => previous + 1)}
              onUnavailable={() => setUnavailable(true)}
            />
          </div>
        ) : (
          <ol aria-label={t('writing.characters')} className="flex flex-wrap justify-center gap-3">
            {characters.map((character, index) => {
              const state = boxState(index)
              return (
                <li key={index}>
                  {state === 'written' || state === 'current' ? (
                    <WritingPad
                      ref={state === 'current' ? padRef : undefined}
                      hanzi={character}
                      hasLocalCopy={hasLocalCopy}
                      size={wideSize}
                      onMistake={onMistake}
                      onDone={() => setWritten((previous) => previous + 1)}
                      onUnavailable={() => setUnavailable(true)}
                    />
                  ) : state === 'given' ? (
                    // A character of the word that isn't asked: shown as is
                    <div
                      className="flex items-center justify-center rounded-xl border border-line text-ink-muted"
                      style={{ width: wideSize, height: wideSize, fontSize: wideSize * 0.6 }}
                    >
                      <HanziText>{character}</HanziText>
                    </div>
                  ) : (
                    // Characters still to write: an empty box
                    <div aria-hidden="true" className="rounded-xl border border-dashed border-line" style={{ width: wideSize, height: wideSize }} />
                  )}
                </li>
              )
            })}
          </ol>
        )}
      </div>

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
        <div className="grid grid-cols-2 gap-3">
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

/** How each character of the word appears: shown as context, written, being written or still to write. */
type BoxState = 'given' | 'written' | 'current' | 'pending'

/**
 * On a phone, where only one pad fits: the word's characters as small boxes,
 * written and given ones filled in and the one being written marked.
 */
function CharacterProgress({ characters, boxState }: { characters: string[]; boxState: (index: number) => BoxState }) {
  return (
    <ol aria-label={t('writing.characters')} className="flex gap-2">
      {characters.map((character, index) => {
        const state = boxState(index)
        return (
          <li
            key={index}
            aria-current={state === 'current' ? 'step' : undefined}
            className={`flex size-10 items-center justify-center rounded-lg border text-2xl ${
              state === 'current' ? 'border-2 border-accent' : state === 'pending' ? 'border-dashed border-line' : 'border-line'
            } ${state === 'given' ? 'text-ink-muted' : ''}`}
          >
            {(state === 'written' || state === 'given') && <HanziText>{character}</HanziText>}
          </li>
        )
      })}
    </ol>
  )
}
