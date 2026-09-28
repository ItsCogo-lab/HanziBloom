import type { ReactNode } from 'react'
import { ButtonLink } from '../components/ui/ButtonLink.tsx'
import { Card } from '../components/ui/Card.tsx'
import { DataTable } from '../components/ui/DataTable.tsx'
import { PageHeader } from '../components/ui/PageHeader.tsx'
import { StatCard } from '../components/ui/StatCard.tsx'
import { EntryLabel } from '../features/dictionary/components/EntryLabel.tsx'
import { hskDictionary, hskStudyItems } from '../features/dictionary/hskDictionary.ts'
import { getStudyItem } from '../features/dictionary/studyItem.ts'
import { useProgress } from '../features/progress/progressContext.ts'
import {
  getAnswerTotals,
  getMostMissed,
  getRecentActivity,
  summarizeItems,
  type AnswerTotals,
} from '../features/progress/stats.ts'
import { getCurrentStreak, getLongestStreak } from '../features/progress/streak.ts'
import type { ProgressData } from '../features/progress/types.ts'
import { formatPercent, formatShortDay, t } from '../i18n/index.ts'
import { fromDateKey } from '../lib/dates.ts'

const characterItems = hskStudyItems.filter((item) => item.kind === 'character')
const wordItems = hskStudyItems.filter((item) => item.kind === 'word')

export function ProgressPage() {
  const { progress } = useProgress()
  const totals = getAnswerTotals(progress.activity)

  return (
    <>
      <PageHeader title={t('nav.progress')} description={t('progress.description')} />
      {totals.answers === 0 ? (
        <Card className="flex flex-col items-start gap-4">
          <p className="text-ink-muted">{t('stats.empty')}</p>
          <ButtonLink to="/practice">{t('dashboard.startSession')}</ButtonLink>
        </Card>
      ) : (
        <Statistics progress={progress} totals={totals} now={new Date()} />
      )}
    </>
  )
}

type StatisticsProps = { progress: ProgressData; totals: AnswerTotals; now: Date }

function Statistics({ progress, totals, now }: StatisticsProps) {
  const recent = getRecentActivity(progress.activity, now)
  const maxAnswers = Math.max(...recent.map((day) => day.answers), 1)
  const byKind = [
    { label: t('dashboard.characters'), summary: summarizeItems(characterItems, progress, now) },
    { label: t('dashboard.words'), summary: summarizeItems(wordItems, progress, now) },
  ]
  const mostMissed = getMostMissed(progress).flatMap((item) => {
    const studyItem = getStudyItem(hskDictionary, item.itemId)
    return studyItem ? [{ studyItem, progress: item }] : []
  })

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="stats-overview">
        <h2 id="stats-overview" className="sr-only">
          {t('stats.overview')}
        </h2>
        <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label={t('stats.answers')} value={totals.answers} />
          <StatCard label={t('stats.accuracy')} value={formatPercent(totals.accuracy ?? 0)} />
          <StatCard label={t('stats.streak')} value={getCurrentStreak(progress.activity, now)} />
          <StatCard label={t('stats.longestStreak')} value={getLongestStreak(progress.activity)} />
        </dl>
      </section>

      <StatsSection id="stats-last-days" title={t('stats.lastDays')}>
        <DataTable
          labelledBy="stats-last-days"
          headers={[t('stats.day'), t('stats.answers'), t('stats.correct')]}
          rows={recent.map((day) => [
            formatShortDay(fromDateKey(day.date)),
            <span key="answers" className="inline-flex items-center gap-3">
              {/* Barra decorativa: la cifra al lado ya da el dato */}
              <span
                aria-hidden="true"
                className="h-2 rounded-full bg-accent"
                style={{ width: `${(day.answers / maxAnswers) * 6}rem` }}
              />
              {day.answers}
            </span>,
            day.correct,
          ])}
        />
      </StatsSection>

      <StatsSection id="stats-by-status" title={t('stats.byStatus')}>
        <DataTable
          labelledBy="stats-by-status"
          headers={[t('stats.type'), t('stats.new'), t('stats.learning'), t('stats.mastered')]}
          rows={byKind.map(({ label, summary }) => [label, summary.new, summary.learning, summary.mastered])}
        />
      </StatsSection>

      {mostMissed.length > 0 && (
        <StatsSection id="stats-most-missed" title={t('stats.mostMissed')}>
          <DataTable
            labelledBy="stats-most-missed"
            headers={[t('stats.item'), t('stats.mistakes'), t('stats.correct')]}
            rows={mostMissed.map(({ studyItem, progress: item }) => [
              <EntryLabel key="entry" entry={studyItem.entry} withMeaning />,
              item.timesWrong,
              item.timesCorrect,
            ])}
          />
        </StatsSection>
      )}
    </div>
  )
}

function StatsSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <Card>
      <h2 id={id} className="mb-3 text-lg font-semibold">
        {title}
      </h2>
      {children}
    </Card>
  )
}
