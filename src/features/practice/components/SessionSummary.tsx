import { Button } from '../../../components/ui/Button.tsx'
import { ButtonLink } from '../../../components/ui/ButtonLink.tsx'
import { Card } from '../../../components/ui/Card.tsx'
import { t } from '../../../i18n/index.ts'
import { formatPinyin, getMeanings } from '../../dictionary/dictionary.ts'
import type { StudyItem } from '../../dictionary/studyItem.ts'
import type { SessionSummary as Summary } from '../session.ts'
import { HanziText } from '../../../components/ui/HanziText.tsx'

type SessionSummaryProps = {
  summary: Summary
  /** Elementos que el usuario no sabía, para repasarlos de un vistazo. */
  missedItems: readonly StudyItem[]
  onRestart: () => void
}

export function SessionSummary({ summary, missedItems, onRestart }: SessionSummaryProps) {
  return (
    <Card className="mx-auto flex max-w-xl flex-col gap-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold tracking-tight">{t('practice.summary.title')}</h2>
        <p className="mt-2 text-lg text-ink-muted">
          {t('practice.summary.score', { correct: summary.correct, total: summary.total })}
        </p>
      </div>

      {missedItems.length > 0 ? (
        <section>
          <h3 className="mb-3 font-medium">{t('practice.summary.toReview')}</h3>
          <ul className="divide-y divide-line">
            {missedItems.map((item) => (
              <li key={`${item.kind}:${item.entry.id}`} className="flex items-baseline gap-4 py-2">
                <HanziText className="text-2xl">{item.entry.hanzi}</HanziText>
                <span className="text-accent-strong">{formatPinyin(item.entry)}</span>
                <span className="text-ink-muted">{getMeanings(item.entry.meanings)[0]}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="text-center text-success">{t('practice.summary.allKnown')}</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <ButtonLink to="/" variant="secondary">
          {t('notFound.backHome')}
        </ButtonLink>
        <Button onClick={onRestart}>{t('practice.again')}</Button>
      </div>
    </Card>
  )
}
