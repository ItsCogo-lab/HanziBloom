import { useId, useMemo, useState, type Ref } from 'react'
import { Button } from '../../../components/ui/Button.tsx'
import { t } from '../../../i18n/index.ts'
import { useDictionaryStore } from '../dictionaryContext.ts'
import { useDictionarySearch } from '../useDictionarySearch.ts'
import { getStudyItemId, type StudyItem } from '../studyItem.ts'
import { EntryLabel } from './EntryLabel.tsx'
import { EntryLink, type EntryOpener } from './EntryLink.tsx'

/** Resultados que se muestran de golpe; el resto, con «Show more». */
const PAGE_SIZE = 50

type DictionarySearchProps = {
  /** Solo caracteres o solo palabras; sin él, los dos. */
  kind?: StudyItem['kind']
  query: string
  onQueryChange: (query: string) => void
  opener: EntryOpener
  /** Sin búsqueda, lista HSK 1-4 (la página) o no muestra nada (el panel de estudio). */
  listAllWhenEmpty?: boolean
  inputRef?: Ref<HTMLInputElement>
}

/**
 * Buscador del diccionario: hanzi, pinyin (con o sin tonos) o inglés. Lo usan
 * la página Dictionary y el panel de las sesiones de estudio. Al empezar a
 * buscar se descarga el diccionario completo (una vez) y, hasta que llega, se
 * busca en HSK 1-4. Se busca cuando se deja de escribir (useDictionarySearch).
 */
export function DictionarySearch({
  kind,
  query,
  onQueryChange,
  opener,
  listAllWhenEmpty = false,
  inputRef,
}: DictionarySearchProps) {
  const inputId = useId()
  const hasQuery = query.trim() !== ''
  const { baseItems } = useDictionaryStore()
  const search = useDictionarySearch(query, { kind })
  const allItems = useMemo(
    () => (!listAllWhenEmpty ? [] : kind ? baseItems.filter((item) => item.kind === kind) : baseItems),
    [baseItems, kind, listAllWhenEmpty],
  )
  const results = hasQuery ? search.results : allItems
  // Mientras se escribe se siguen viendo los resultados anteriores
  const showCount = hasQuery
    ? search.status === 'ready' || (search.status === 'pending' && results.length > 0)
    : listAllWhenEmpty
  // El número de resultados visibles vuelve a PAGE_SIZE con cada búsqueda nueva
  const [shown, setShown] = useState({ query, count: PAGE_SIZE })
  const count = shown.query === query ? shown.count : PAGE_SIZE

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="font-medium">
          {t('dictionary.search')}
        </label>
        <input
          ref={inputRef}
          id={inputId}
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={t('dictionary.searchPlaceholder')}
          autoComplete="off"
          className="w-full rounded-xl border border-line bg-surface px-4 py-2.5"
        />
      </div>

      {search.status === 'too-short' && <p className="text-sm text-ink-muted">{t('dictionary.queryTooShort')}</p>}
      {search.status === 'pending' && results.length === 0 && (
        <p className="text-sm text-ink-muted" role="status">
          {t('dictionary.searching')}
        </p>
      )}
      {showCount && (
        <p className="text-sm text-ink-muted" aria-live="polite">
          {results.length === 0
            ? t('dictionary.noResults')
            : t('dictionary.showing', { count: Math.min(count, results.length), total: results.length })}
        </p>
      )}
      {!hasQuery && !listAllWhenEmpty && <p className="text-sm text-ink-muted">{t('dictionary.typeToSearch')}</p>}
      {hasQuery && search.dictionary !== 'complete' && (
        <p className="text-sm text-ink-muted" role="status">
          {t(search.dictionary === 'loading' ? 'dictionary.loadingFull' : 'dictionary.fullUnavailable')}
        </p>
      )}

      {results.length > 0 && (
        <ul
          aria-label={t('dictionary.results')}
          className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface"
        >
          {results.slice(0, count).map((item) => (
            <li key={getStudyItemId(item)}>
              <EntryLink
                item={item}
                opener={opener}
                className="flex w-full items-center justify-between gap-4 px-4 py-3 hover:bg-paper"
              >
                <EntryLabel entry={item.entry} withMeaning />
                <span className="shrink-0 text-xs text-ink-muted">
                  {t(item.kind === 'character' ? 'practice.kind.character' : 'practice.kind.word')}
                  {item.entry.hskLevel !== undefined && ` · ${t('dictionary.hskLevelValue', { level: item.entry.hskLevel })}`}
                </span>
              </EntryLink>
            </li>
          ))}
        </ul>
      )}
      {count < results.length && (
        <Button variant="secondary" className="self-start" onClick={() => setShown({ query, count: count + PAGE_SIZE })}>
          {t('sets.showMore')}
        </Button>
      )}
    </div>
  )
}
