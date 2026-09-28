import { TOPIC_CURATION_NOTE } from '../../data/topics.ts'
import { useStudySets } from '../../features/studySets/useStudySets.ts'
import { SetCard } from '../../features/studySets/components/SetCard.tsx'
import { listSetsOfType } from '../../features/studySets/studySets.ts'
import type { StudySetType } from '../../features/studySets/types.ts'
import { t } from '../../i18n/index.ts'

/** Lista de sets de un tipo (HSK o temas). Los sets nuevos aparecen solos. */
export function SetListPage({ type }: { type: Exclude<StudySetType, 'custom'> }) {
  const sets = listSetsOfType(useStudySets(), type)
  return (
    <section aria-labelledby="set-list-title" className="flex flex-col gap-4">
      <div>
        <h2 id="set-list-title" className="text-xl font-semibold">
          {t(type === 'hsk' ? 'study.hskTitle' : 'study.topicsTitle')}
        </h2>
        <p className="text-ink-muted">{type === 'hsk' ? t('study.hskIntro') : TOPIC_CURATION_NOTE}</p>
      </div>
      <ul className="grid gap-4 md:grid-cols-2">
        {sets.map((set) => (
          <li key={set.id} className="flex">
            <div className="flex-1">
              <SetCard set={set} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
