import { useParams } from 'react-router'
import { Link } from 'react-router'
import { ButtonLink } from '../components/ui/ButtonLink.tsx'
import { Card } from '../components/ui/Card.tsx'
import { PageHeader } from '../components/ui/PageHeader.tsx'
import { EntryDetails } from '../features/dictionary/components/EntryDetails.tsx'
import { hskDictionary } from '../features/dictionary/hskDictionary.ts'
import { getStudyItem, getStudyItemId, type StudyItem } from '../features/dictionary/studyItem.ts'
import { ItemProgressCard } from '../features/progress/components/ItemProgressCard.tsx'
import { useProgress } from '../features/progress/progressContext.ts'
import { useStudySets } from '../features/studySets/useStudySets.ts'
import { getSetPath } from '../features/studySets/setPaths.ts'
import { getSetsWithItem } from '../features/studySets/studySets.ts'
import { t } from '../i18n/index.ts'
import { getEntryPath } from '../features/dictionary/entryPaths.ts'
import { NotFoundPage } from './NotFoundPage.tsx'

/** Ficha de un carácter (/characters/好) o de una palabra (/vocabulary/你好). */
export function EntryDetailPage({ kind }: { kind: StudyItem['kind'] }) {
  const { id = '' } = useParams()
  const { progress } = useProgress()
  const item = getStudyItem(hskDictionary, kind === 'character' ? `char:${id}` : `word:${id}`)

  if (!item) return <NotFoundPage />

  const isCharacter = item.kind === 'character'
  return (
    <>
      <PageHeader
        title={item.entry.hanzi}
        titleLang="zh-Hans"
        description={t(isCharacter ? 'practice.kind.character' : 'practice.kind.word')}
        actions={
          <ButtonLink to="/dictionary" variant="secondary">
            {t('dictionary.backToDictionary')}
          </ButtonLink>
        }
      />
      <div className="flex max-w-3xl flex-col gap-6">
        <EntryDetails item={item} dictionary={hskDictionary} opener={{ getHref: getEntryPath }} />
        <ItemProgressCard item={progress.items[getStudyItemId(item)]} now={new Date()} />
        <StudySetsOfItem item={item} />
      </div>
    </>
  )
}

/** Los sets en los que está el elemento (puede estar en varios: 苹果 en HSK 1 y en «Food & drink»). */
function StudySetsOfItem({ item }: { item: StudyItem }) {
  const studySets = useStudySets()
  const sets = getSetsWithItem(studySets, getStudyItemId(item))
  if (sets.length === 0) return null
  return (
    <Card>
      <h2 className="mb-3 text-lg font-semibold">{t('dictionary.inSets')}</h2>
      <ul className="flex flex-wrap gap-2">
        {sets.map((set) => (
          <li key={set.id}>
            <Link
              to={getSetPath(set)}
              className="inline-block rounded-full border border-line bg-paper px-3 py-1 hover:border-accent"
            >
              {set.name}
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  )
}
