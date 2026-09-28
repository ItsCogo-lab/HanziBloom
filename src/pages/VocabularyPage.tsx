import { PageHeader } from '../components/ui/PageHeader.tsx'
import { EntryList } from '../features/dictionary/components/EntryList.tsx'
import { hskStudyItems } from '../features/dictionary/hskDictionary.ts'
import { getStudyItemId } from '../features/dictionary/studyItem.ts'
import { StatusBadge } from '../features/progress/components/StatusBadge.tsx'
import { getItemStatus } from '../features/progress/progress.ts'
import { useProgress } from '../features/progress/progressContext.ts'
import { t } from '../i18n/index.ts'
import { getEntryPath } from './entryPaths.ts'

const wordItems = hskStudyItems.filter((item) => item.kind === 'word')

export function VocabularyPage() {
  const { progress } = useProgress()
  return (
    <>
      <PageHeader title={t('nav.vocabulary')} description={t('vocabulary.description')} />
      <EntryList
        items={wordItems}
        getHref={getEntryPath}
        renderExtra={(item) => <StatusBadge status={getItemStatus(progress.items[getStudyItemId(item)])} />}
      />
    </>
  )
}
