import { useState, type ReactNode } from 'react'
import { Button } from '../../../components/ui/Button.tsx'
import { Card } from '../../../components/ui/Card.tsx'
import { t } from '../../../i18n/index.ts'
import { StatusBadge } from '../../progress/components/StatusBadge.tsx'
import { EntryDetails } from '../../dictionary/components/EntryDetails.tsx'
import { EntryLabel } from '../../dictionary/components/EntryLabel.tsx'
import type { Dictionary } from '../../dictionary/dictionary.ts'
import { getStudyItemId, type StudyItem } from '../../dictionary/studyItem.ts'
import { SessionFrame } from './SessionFrame.tsx'

type LearnSessionProps = {
  /** Elementos nuevos que presenta la sesión, en orden. */
  items: readonly StudyItem[]
  dictionary: Dictionary
  /** Se llama al confirmar que un elemento está aprendido, para guardarlo al momento. */
  onLearned: (item: StudyItem) => void
  /** Se llama cuando el usuario ya dominaba el elemento: vuelve a salir en Study muy de vez en cuando. */
  onKnown: (item: StudyItem) => void
  /** Acciones del resumen final (p. ej. repasar lo aprendido). */
  summaryActions: ReactNode
  /** Contenido extra bajo la ficha, p. ej. las notas del usuario en un set propio. */
  renderExtra?: (item: StudyItem) => ReactNode
}

/**
 * Sesión Learn: presenta elementos nuevos uno a uno con su ficha completa
 * (la misma del diccionario) y el usuario confirma cuáles ha aprendido. No
 * hay preguntas: eso es Study.
 */
export function LearnSession({
  items,
  dictionary,
  onLearned,
  onKnown,
  summaryActions,
  renderExtra,
}: LearnSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  // Lo aprendido en la sesión; `known` indica si el usuario ya lo dominaba
  const [learned, setLearned] = useState<readonly { item: StudyItem; known: boolean }[]>([])
  const item = items[currentIndex]

  if (!item) {
    return (
      <Card className="mx-auto flex max-w-xl flex-col gap-4 sm:gap-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight">{t('learn.summary.title')}</h2>
          <p className="mt-2 text-lg text-ink-muted">
            {t('learn.summary.count', { learned: learned.length, total: items.length })}
          </p>
        </div>
        {learned.length > 0 && (
          <ul className="divide-y divide-line">
            {learned.map(({ item: learnedItem, known }) => (
              <li key={getStudyItemId(learnedItem)} className="flex items-center justify-between gap-3 py-2">
                <EntryLabel entry={learnedItem.entry} withMeaning />
                {known && <StatusBadge status="mastered" />}
              </li>
            ))}
          </ul>
        )}
        <div className="grid gap-3 sm:grid-cols-2">{summaryActions}</div>
      </Card>
    )
  }

  const next = (choice: 'skip' | 'learned' | 'known') => {
    if (choice === 'learned') onLearned(item)
    if (choice === 'known') onKnown(item)
    if (choice !== 'skip') setLearned([...learned, { item, known: choice === 'known' }])
    setCurrentIndex(currentIndex + 1)
  }

  const progressText = t('learn.progress', { current: currentIndex + 1, total: items.length })
  return (
    <SessionFrame
      progressText={progressText}
      value={currentIndex}
      max={items.length}
    >
      {(lookUp) => (
        <>
          <p className="text-center text-sm font-medium tracking-wide text-ink-muted uppercase">
            {t(item.kind === 'word' ? 'learn.newWord' : 'learn.newCharacter')}
          </p>
          {/* key: cada elemento empieza con su ficha desde arriba */}
          <EntryDetails key={getStudyItemId(item)} item={item} dictionary={dictionary} opener={{ onOpen: lookUp }} />
          {renderExtra?.(item)}
          {/* En móvil "Ya lo sé" ocupa su propia fila encima de las otras dos */}
          <div className="sticky bottom-(--mobile-nav-height) -mx-1 grid grid-cols-2 gap-3 bg-paper px-1 py-3 sm:grid-cols-3 md:bottom-0">
            <Button variant="secondary" onClick={() => next('skip')}>
              {t('learn.skip')}
            </Button>
            <Button variant="secondary" className="order-first col-span-2 sm:order-none sm:col-span-1" onClick={() => next('known')}>
              {t('learn.alreadyKnown')}
            </Button>
            <Button onClick={() => next('learned')}>{t('learn.gotIt')}</Button>
          </div>
        </>
      )}
    </SessionFrame>
  )
}
