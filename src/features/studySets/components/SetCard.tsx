import { Link } from 'react-router'
import { t } from '../../../i18n/index.ts'
import { isStudying } from '../../myStudies/myStudies.ts'
import { useMyStudies } from '../../myStudies/myStudiesContext.ts'
import { useProgress } from '../../progress/progressContext.ts'
import { getSetPath } from '../setPaths.ts'
import { getSetProgress } from '../setProgress.ts'
import type { StudySet } from '../types.ts'
import { SetItemCount, StudyingBadge } from './SetSummary.tsx'
import { SetProgressBar } from './SetProgressBar.tsx'
import { StudyToggleButton } from './StudyToggleButton.tsx'

/**
 * Card for a set: name, size, description, progress and actions. It is the
 * same for HSK, topics and (in the future) custom sets.
 */
export function SetCard({ set }: { set: StudySet }) {
  const { progress } = useProgress()
  const { myStudies } = useMyStudies()
  const setProgress = getSetProgress(set, progress, new Date())

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 shadow-sm sm:gap-4 sm:p-5">
      <div className="flex items-start gap-4">
        {set.icon && (
          <span
            aria-hidden="true"
            className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent-soft font-hanzi text-2xl text-accent-strong"
          >
            {set.icon}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 className="text-lg font-semibold">
              <Link to={getSetPath(set)} className="hover:text-accent-strong hover:underline">
                {set.name}
              </Link>
            </h3>
            {isStudying(myStudies, set.id) && <StudyingBadge />}
          </div>
          <p className="text-sm text-ink-muted">
            <SetItemCount set={set} />
          </p>
        </div>
      </div>
      {set.description && <p>{set.description}</p>}
      <SetProgressBar name={set.name} progress={setProgress} />
      <div className="mt-auto flex flex-wrap gap-2">
        <Link
          to={getSetPath(set)}
          aria-label={t('sets.openNamed', { name: set.name })}
          className="inline-flex items-center rounded-xl px-3 py-2.5 font-medium text-accent-strong hover:bg-accent-soft"
        >
          {t('sets.open')}
        </Link>
        <StudyToggleButton set={set} />
      </div>
    </article>
  )
}
