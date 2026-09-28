import { ButtonLink } from '../components/ui/ButtonLink.tsx'
import { Card } from '../components/ui/Card.tsx'
import { PageHeader } from '../components/ui/PageHeader.tsx'
import { ProgressBar } from '../components/ui/ProgressBar.tsx'
import { StatCard } from '../components/ui/StatCard.tsx'
import { hskStudyItems } from '../features/dictionary/hskDictionary.ts'
import { useProgress } from '../features/progress/progressContext.ts'
import { summarizeItems, type ItemsSummary } from '../features/progress/stats.ts'
import { getCurrentStreak } from '../features/progress/streak.ts'
import { t, type MessageKey } from '../i18n/index.ts'

const characterItems = hskStudyItems.filter((item) => item.kind === 'character')
const wordItems = hskStudyItems.filter((item) => item.kind === 'word')

/** Qué decir en «Today» según cómo va el usuario. */
function getTodayMessage(summary: ItemsSummary): MessageKey {
  if (summary.due > 0) return 'dashboard.message.due'
  if (summary.studied === 0) return 'dashboard.message.welcome'
  if (summary.new > 0) return 'dashboard.message.learnNew'
  return 'dashboard.message.allDone'
}

export function DashboardPage() {
  const { progress } = useProgress()
  const now = new Date()
  const summary = summarizeItems(hskStudyItems, progress, now)

  return (
    <>
      <PageHeader
        title={t('nav.dashboard')}
        description={t('dashboard.description')}
        actions={<ButtonLink to="/practice">{t('dashboard.startSession')}</ButtonLink>}
      />

      <div className="flex flex-col gap-6">
        <Card>
          <h2 className="text-lg font-semibold">{t('dashboard.today')}</h2>
          <p className="mt-1 text-ink-muted">{t(getTodayMessage(summary))}</p>
        </Card>

        <section aria-labelledby="dashboard-overview">
          <h2 id="dashboard-overview" className="sr-only">
            {t('dashboard.overview')}
          </h2>
          <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label={t('stats.due')} value={summary.due} />
            <StatCard label={t('stats.streak')} value={getCurrentStreak(progress.activity, now)} />
            <StatCard
              label={t('stats.studied')}
              value={summary.studied}
              detail={t('stats.studiedOf', { total: summary.total })}
            />
            <StatCard label={t('stats.mastered')} value={summary.mastered} />
          </dl>
        </section>

        <Card>
          <h2 className="mb-4 text-lg font-semibold">{t('dashboard.hskProgress')}</h2>
          <div className="flex flex-col gap-5">
            <KindProgress label={t('dashboard.characters')} summary={summarizeItems(characterItems, progress, now)} />
            <KindProgress label={t('dashboard.words')} summary={summarizeItems(wordItems, progress, now)} />
          </div>
        </Card>
      </div>
    </>
  )
}

function KindProgress({ label, summary }: { label: string; summary: ItemsSummary }) {
  const text = t('dashboard.kindProgress', {
    studied: summary.studied,
    total: summary.total,
    mastered: summary.mastered,
  })
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <h3 className="font-medium">{label}</h3>
        <p className="text-sm text-ink-muted">{text}</p>
      </div>
      <ProgressBar value={summary.studied} max={summary.total} label={`${label}: ${text}`} />
    </div>
  )
}
