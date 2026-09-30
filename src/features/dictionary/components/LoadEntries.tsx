import type { ReactNode } from 'react'
import { t } from '../../../i18n/index.ts'
import { useLoadItems } from '../dictionaryContext.ts'
import type { StudyItemId } from '../studyItem.ts'

type LoadEntriesProps = {
  itemIds: readonly StudyItemId[]
  children: ReactNode
}

/**
 * Shows `children` once the entries for these items have loaded.
 * HSK 1-4 ones are always there; full dictionary ones are
 * requested the first time (a custom set, an entry page).
 */
export function LoadEntries({ itemIds, children }: LoadEntriesProps) {
  const status = useLoadItems(itemIds)
  if (status === 'loading') {
    return (
      <p role="status" className="text-ink-muted">
        {t('dictionary.loadingEntries')}
      </p>
    )
  }
  if (status === 'error') {
    return (
      <p role="alert" className="text-ink-muted">
        {t('dictionary.entriesUnavailable')}
      </p>
    )
  }
  return children
}
