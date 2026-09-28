import { NavLink, Outlet } from 'react-router'
import { PageHeader } from '../../components/ui/PageHeader.tsx'
import { t, type MessageKey } from '../../i18n/index.ts'

/** Pestañas de la sección Study. Añadir una = añadir una entrada y su <Route>. */
const STUDY_TABS: readonly { path: string; labelKey: MessageKey }[] = [
  { path: '/study', labelKey: 'study.myStudies' },
  { path: '/study/hsk', labelKey: 'study.hsk' },
  { path: '/study/topics', labelKey: 'study.topics' },
]

/** Sección Study: My Studies, sets HSK y sets por temas. */
export function StudyLayout() {
  return (
    <>
      <PageHeader title={t('nav.study')} description={t('study.description')} />
      <nav aria-label={t('study.sections')} className="mb-6 overflow-x-auto">
        <ul className="flex gap-1 border-b border-line">
          {STUDY_TABS.map((tab) => (
            <li key={tab.path}>
              <NavLink
                to={tab.path}
                end
                className={({ isActive }) =>
                  `-mb-px inline-block border-b-2 px-4 py-2.5 font-medium whitespace-nowrap ${
                    isActive ? 'border-accent text-accent-strong' : 'border-transparent text-ink-muted hover:text-ink'
                  }`
                }
              >
                {t(tab.labelKey)}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <Outlet />
    </>
  )
}
