import type { ReactNode } from 'react'
import { t } from '../../../i18n/index.ts'
import { useLoadItems } from '../dictionaryContext.ts'
import type { StudyItemId } from '../studyItem.ts'

type LoadEntriesProps = {
  itemIds: readonly StudyItemId[]
  children: ReactNode
}

/**
 * Muestra `children` cuando ya están cargadas las entradas de estos
 * elementos. Las de HSK 1-4 están siempre; las del diccionario completo se
 * piden la primera vez (un set propio, una ficha).
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
