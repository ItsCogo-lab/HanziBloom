import { useParams } from 'react-router'
import { ButtonLink } from '../components/ui/ButtonLink.tsx'
import { PageHeader } from '../components/ui/PageHeader.tsx'
import { EntryDetails } from '../features/dictionary/components/EntryDetails.tsx'
import { hskDictionary } from '../features/dictionary/hskDictionary.ts'
import { getStudyItem, getStudyItemId, type StudyItem } from '../features/dictionary/studyItem.ts'
import { ItemProgressCard } from '../features/progress/components/ItemProgressCard.tsx'
import { useProgress } from '../features/progress/progressContext.ts'
import { t } from '../i18n/index.ts'
import { getEntryPath } from './entryPaths.ts'
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
          <ButtonLink to={isCharacter ? '/characters' : '/vocabulary'} variant="secondary">
            {t(isCharacter ? 'dictionary.allCharacters' : 'dictionary.allWords')}
          </ButtonLink>
        }
      />
      <div className="flex max-w-3xl flex-col gap-6">
        <EntryDetails item={item} dictionary={hskDictionary} getHref={getEntryPath} />
        <ItemProgressCard item={progress.items[getStudyItemId(item)]} now={new Date()} />
      </div>
    </>
  )
}
