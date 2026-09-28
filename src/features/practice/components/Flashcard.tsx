import { useEffect, useRef, useState } from 'react'
import { Button } from '../../../components/ui/Button.tsx'
import { Card } from '../../../components/ui/Card.tsx'
import { t } from '../../../i18n/index.ts'
import {
  formatPinyin,
  getCharactersOfWord,
  getMeanings,
  getWordsWithCharacter,
  type Dictionary,
} from '../../dictionary/dictionary.ts'
import type { StudyItem } from '../../dictionary/studyItem.ts'
import type { FlashcardExercise } from '../types.ts'
import { HanziText } from '../../../components/ui/HanziText.tsx'

/** Máximo de palabras relacionadas que se muestran en un carácter. */
const MAX_RELATED_WORDS = 4

type FlashcardProps = {
  exercise: FlashcardExercise
  dictionary: Dictionary
  onAnswer: (correct: boolean) => void
}

export function Flashcard({ exercise, dictionary, onAnswer }: FlashcardProps) {
  const [isRevealed, setIsRevealed] = useState(false)
  const answerRef = useRef<HTMLDivElement>(null)
  const { item } = exercise

  // Al revelar, el botón «Show answer» desaparece: movemos el foco a la
  // respuesta para que el teclado y el lector de pantalla sigan en su sitio.
  useEffect(() => {
    if (isRevealed) answerRef.current?.focus()
  }, [isRevealed])

  return (
    <Card className="flex flex-col items-center gap-6 text-center">
      <p className="text-sm font-medium tracking-wide text-ink-muted uppercase">
        {t(item.kind === 'character' ? 'practice.kind.character' : 'practice.kind.word')}
      </p>
      <HanziText className="text-7xl leading-tight sm:text-8xl">{item.entry.hanzi}</HanziText>

      {isRevealed ? (
        <div
          ref={answerRef}
          role="group"
          tabIndex={-1}
          aria-label={t('practice.answer')}
          className="flex w-full flex-col items-center gap-6 outline-none"
        >
          <FlashcardAnswer item={item} dictionary={dictionary} />
          <div className="grid w-full gap-3 sm:grid-cols-2">
            <Button variant="secondary" onClick={() => onAnswer(false)}>
              {t('practice.didNotKnow')}
            </Button>
            <Button onClick={() => onAnswer(true)}>{t('practice.knewIt')}</Button>
          </div>
        </div>
      ) : (
        <Button className="w-full sm:w-auto" onClick={() => setIsRevealed(true)}>
          {t('practice.showAnswer')}
        </Button>
      )}
    </Card>
  )
}

function FlashcardAnswer({ item, dictionary }: { item: StudyItem; dictionary: Dictionary }) {
  const related =
    item.kind === 'word'
      ? getCharactersOfWord(dictionary, item.entry)
      : getWordsWithCharacter(dictionary, item.entry.id)
          // 谁 aparece en la palabra 谁: no aporta nada mostrarla
          .filter((word) => word.hanzi !== item.entry.hanzi)
          .slice(0, MAX_RELATED_WORDS)

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <p className="text-2xl font-medium text-accent-strong">{formatPinyin(item.entry)}</p>
      <ul className="space-y-1 text-lg">
        {getMeanings(item.entry.meanings).map((meaning) => (
          <li key={meaning}>{meaning}</li>
        ))}
      </ul>

      {related.length > 0 && (
        <div className="w-full border-t border-line pt-4">
          <p className="mb-2 text-sm text-ink-muted">
            {t(item.kind === 'word' ? 'practice.charactersInWord' : 'practice.wordsWithCharacter')}
          </p>
          <ul className="flex flex-wrap justify-center gap-2">
            {related.map((entry) => (
              <li key={entry.id} className="rounded-lg bg-paper px-3 py-1.5">
                <HanziText className="mr-2 text-lg">{entry.hanzi}</HanziText>
                <span className="text-sm text-ink-muted">{formatPinyin(entry)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
