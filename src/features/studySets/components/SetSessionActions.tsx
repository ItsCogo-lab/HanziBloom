import { ButtonLink } from '../../../components/ui/ButtonLink.tsx'
import { t, tCount } from '../../../i18n/index.ts'
import { useProgress } from '../../progress/progressContext.ts'
import { getSetSessionCounts } from '../sessionItems.ts'
import { getSetSessionPath } from '../setPaths.ts'
import type { StudySet } from '../types.ts'
import { SessionTypeLabel } from './SessionTypeLabel.tsx'

/**
 * The two actions of a set, Learn and Study, with how many items each one has
 * right now (computed from current progress, never fixed).
 */
export function SetSessionActions({ set }: { set: StudySet }) {
  const { progress } = useProgress()
  const counts = getSetSessionCounts(set, progress, new Date())

  return (
    <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
      <section className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-5">
        <SessionTypeLabel type="learn" as="h2" />
        <p>
          {counts.learnable > 0
            ? tCount(counts.learnable, 'session.learnAvailableOne', 'session.learnAvailable')
            : t('session.learnEmpty')}
        </p>
        {counts.learnable > 0 && (
          <ButtonLink
            to={getSetSessionPath(set, 'learn')}
            aria-label={t('session.learnNamed', { name: set.name })}
            className="mt-auto self-start"
          >
            {t('session.learn')}
          </ButtonLink>
        )}
      </section>
      <section className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-5">
        <SessionTypeLabel type="study" as="h2" />
        <p>
          {counts.learned === 0
            ? t('session.studyEmpty')
            : counts.due > 0
              ? tCount(counts.due, 'session.studyDueOne', 'session.studyDue')
              : t('session.studyUpToDate')}
        </p>
        <div className="mt-auto self-start">
          {counts.learned === 0 ? (
            <ButtonLink to={getSetSessionPath(set, 'learn')} variant="secondary">
              {t('session.startLearning')}
            </ButtonLink>
          ) : counts.due > 0 ? (
            <ButtonLink to={getSetSessionPath(set, 'study')} aria-label={t('session.studyNamed', { name: set.name })}>
              {t('session.study')}
            </ButtonLink>
          ) : (
            <ButtonLink to={getSetSessionPath(set, 'study', { reviewAll: true })} variant="secondary">
              {t('session.reviewAnyway')}
            </ButtonLink>
          )}
        </div>
      </section>
    </div>
  )
}

/** Compact version for lists (My Studies, Home): one button per available action. */
export function SetSessionButtons({ set }: { set: StudySet }) {
  const { progress } = useProgress()
  const counts = getSetSessionCounts(set, progress, new Date())
  return (
    <>
      {counts.learnable > 0 && (
        <ButtonLink to={getSetSessionPath(set, 'learn')} aria-label={t('session.learnNamed', { name: set.name })}>
          <span aria-hidden="true" className="font-hanzi">
            新
          </span>
          {t('session.learn')}
        </ButtonLink>
      )}
      {counts.learned > 0 && (
        <ButtonLink
          to={getSetSessionPath(set, 'study', { reviewAll: counts.due === 0 })}
          variant="secondary"
          aria-label={t('session.studyNamed', { name: set.name })}
        >
          <span aria-hidden="true" className="font-hanzi">
            复
          </span>
          {t('session.study')}
        </ButtonLink>
      )}
    </>
  )
}
