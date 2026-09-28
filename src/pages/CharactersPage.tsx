import { PageHeader } from '../components/ui/PageHeader.tsx'
import { EntryList } from '../features/dictionary/components/EntryList.tsx'
import { hskStudyItems } from '../features/dictionary/hskDictionary.ts'
import { getStudyItemId } from '../features/dictionary/studyItem.ts'
import { StatusBadge } from '../features/progress/components/StatusBadge.tsx'
import { getItemStatus } from '../features/progress/progress.ts'
import { useProgress } from '../features/progress/progressContext.ts'
import { t } from '../i18n/index.ts'
import { getEntryPath } from './entryPaths.ts'

const characterItems = hskStudyItems.filter((item) => item.kind === 'character')

export function CharactersPage() {
  const { progress } = useProgress()
  return (
    <>
      <PageHeader title={t('nav.characters')} description={t('characters.description')} />
      <EntryList
        items={characterItems}
        getHref={getEntryPath}
        renderExtra={(item) => <StatusBadge status={getItemStatus(progress.items[getStudyItemId(item)])} />}
      />
    </>
  )
}
