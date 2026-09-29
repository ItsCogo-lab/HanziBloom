import { Link } from 'react-router'
import { ButtonLink } from '../../components/ui/ButtonLink.tsx'
import { Card } from '../../components/ui/Card.tsx'
import { useMyStudies } from '../../features/myStudies/myStudiesContext.ts'
import { useProgress } from '../../features/progress/progressContext.ts'
import { useStudySets } from '../../features/studySets/useStudySets.ts'
import { getSetPath } from '../../features/studySets/setPaths.ts'
import { SetSessionButtons } from '../../features/studySets/components/SetSessionActions.tsx'
import { SetItemCount } from '../../features/studySets/components/SetSummary.tsx'
import { SetProgressBar } from '../../features/studySets/components/SetProgressBar.tsx'
import { StudyToggleButton } from '../../features/studySets/components/StudyToggleButton.tsx'
import { getSetProgress } from '../../features/studySets/setProgress.ts'
import { getStudySet } from '../../features/studySets/studySets.ts'
import { t } from '../../i18n/index.ts'

/** Los sets que el usuario está estudiando, con su progreso y acciones. */
export function MyStudiesPage() {
  const { myStudies } = useMyStudies()
  const studySets = useStudySets()
  const { progress } = useProgress()
  const now = new Date()
  // Un set guardado que ya no existe (p. ej. un tema retirado) simplemente no se muestra
  const sets = myStudies.sets.map(({ setId }) => getStudySet(studySets, setId)).filter((set) => set !== undefined)

  if (sets.length === 0) {
    return (
      <Card className="flex flex-col items-start gap-4">
        <h2 className="text-lg font-semibold">{t('myStudies.emptyTitle')}</h2>
        <p className="text-ink-muted">{t('myStudies.empty')}</p>
        <div className="flex flex-wrap gap-2">
          <ButtonLink to="/study/hsk">{t('myStudies.browseHsk')}</ButtonLink>
          <ButtonLink to="/study/topics" variant="secondary">
            {t('myStudies.browseTopics')}
          </ButtonLink>
        </div>
      </Card>
    )
  }

  return (
    <section aria-labelledby="my-studies-title" className="flex flex-col gap-4">
      <h2 id="my-studies-title" className="sr-only">
        {t('study.myStudies')}
      </h2>
      <ul className="flex flex-col gap-3">
        {sets.map((set) => {
          const setProgress = getSetProgress(set, progress, now)
          return (
            <li key={set.id} className="rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex flex-wrap items-baseline gap-x-3">
                    <h3 className="text-lg font-semibold">
                      <Link to={getSetPath(set)} className="hover:text-accent-strong hover:underline">
                        {set.name}
                      </Link>
                    </h3>
                    <span className="text-sm text-ink-muted">
                      <SetItemCount set={set} />
                    </span>
                  </div>
                  <SetProgressBar name={set.name} progress={setProgress} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <SetSessionButtons set={set} />
                  <StudyToggleButton set={set} />
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
