import { Card } from '../../../components/ui/Card.tsx'
import { formatDate, t } from '../../../i18n/index.ts'
import { getItemStatus, isDue } from '../progress.ts'
import type { ItemProgress } from '../types.ts'
import { StatusBadge } from './StatusBadge.tsx'

type ItemProgressCardProps = {
  /** `undefined` si el elemento aún no se ha estudiado. */
  item: ItemProgress | undefined
  now: Date
}

/** Cómo va el usuario con un carácter o una palabra concretos. */
export function ItemProgressCard({ item, now }: ItemProgressCardProps) {
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">{t('dictionary.yourProgress')}</h2>
        <StatusBadge status={getItemStatus(item)} />
      </div>
      {item ? (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
          <Fact label={t('dictionary.timesSeen')} value={item.timesSeen} />
          <Fact label={t('stats.correct')} value={item.timesCorrect} />
          <Fact label={t('stats.mistakes')} value={item.timesWrong} />
          <Fact
            label={t('dictionary.nextReview')}
            value={isDue(item, now) ? t('dictionary.dueNow') : formatDate(new Date(item.nextReviewAt))}
          />
        </dl>
      ) : (
        <p className="text-ink-muted">{t('dictionary.notStudied')}</p>
      )}
    </Card>
  )
}

function Fact({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd className="text-lg font-medium tabular-nums">{value}</dd>
    </div>
  )
}
