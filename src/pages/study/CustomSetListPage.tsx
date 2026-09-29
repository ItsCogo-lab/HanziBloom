import { ButtonLink } from '../../components/ui/ButtonLink.tsx'
import { SetCard } from '../../features/studySets/components/SetCard.tsx'
import { listSetsOfType } from '../../features/studySets/studySets.ts'
import { useStudySets } from '../../features/studySets/useStudySets.ts'
import { t } from '../../i18n/index.ts'

/** Pestaña «My sets»: los sets que ha creado el usuario. */
export function CustomSetListPage() {
  const sets = listSetsOfType(useStudySets(), 'custom')
  return (
    <section aria-labelledby="custom-list-title" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="custom-list-title" className="text-xl font-semibold">
            {t('custom.title')}
          </h2>
          <p className="text-ink-muted">{t('custom.intro')}</p>
        </div>
        <ButtonLink to="/study/custom/new">{t('custom.create')}</ButtonLink>
      </div>
      {sets.length === 0 ? (
        <p className="text-ink-muted">{t('custom.empty')}</p>
      ) : (
        <ul className="grid gap-3 sm:gap-4 md:grid-cols-2">
          {sets.map((set) => (
            <li key={set.id} className="flex">
              <div className="flex-1">
                <SetCard set={set} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
