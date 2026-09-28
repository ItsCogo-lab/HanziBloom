import { useId, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { Card } from '../../../components/ui/Card.tsx'
import { t } from '../../../i18n/index.ts'
import { matchesSearch } from '../search.ts'
import { getStudyItemId, type StudyItem } from '../studyItem.ts'
import { EntryLabel } from './EntryLabel.tsx'

type EntryListProps = {
  items: readonly StudyItem[]
  /** Ruta de la ficha de cada elemento. */
  getHref: (item: StudyItem) => string
  /** Algo que mostrar a la derecha de cada fila, p. ej. su estado de estudio. */
  renderExtra?: (item: StudyItem) => ReactNode
}

/** Lista de caracteres o palabras con un buscador. */
export function EntryList({ items, getHref, renderExtra }: EntryListProps) {
  const [query, setQuery] = useState('')
  const searchId = useId()
  const results = items.filter((item) => matchesSearch(item.entry, query))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={searchId} className="font-medium">
          {t('dictionary.search')}
        </label>
        <input
          id={searchId}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('dictionary.searchPlaceholder')}
          className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 sm:max-w-sm"
        />
      </div>
      <p className="text-sm text-ink-muted" aria-live="polite">
        {t('dictionary.showing', { count: results.length, total: items.length })}
      </p>

      {results.length === 0 ? (
        <Card>
          <p className="text-ink-muted">{t('dictionary.noResults')}</p>
        </Card>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {results.map((item) => (
            <li key={getStudyItemId(item)}>
              <Link
                to={getHref(item)}
                className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-paper"
              >
                <EntryLabel entry={item.entry} withMeaning />
                {renderExtra?.(item)}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
