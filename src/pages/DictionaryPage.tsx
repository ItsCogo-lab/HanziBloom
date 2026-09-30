import { useState } from 'react'
import { useLocation, useSearchParams } from 'react-router'
import { PageHeader } from '../components/ui/PageHeader.tsx'
import { DictionarySearch } from '../features/dictionary/components/DictionarySearch.tsx'
import { ToneLegend } from '../features/dictionary/components/ToneLegend.tsx'
import type { StudyItem } from '../features/dictionary/studyItem.ts'
import { t, type MessageKey } from '../i18n/index.ts'
import { getEntryPath } from '../features/dictionary/entryPaths.ts'

type KindFilter = 'all' | StudyItem['kind']

const KIND_FILTERS: readonly { value: KindFilter; labelKey: MessageKey }[] = [
  { value: 'all', labelKey: 'dictionary.kind.all' },
  { value: 'character', labelKey: 'dictionary.kind.characters' },
  { value: 'word', labelKey: 'dictionary.kind.words' },
]

function isKindFilter(value: string | null): value is KindFilter {
  return KIND_FILTERS.some((filter) => filter.value === value)
}

/** Marks the navigations the search box itself makes while typing. */
const FROM_SEARCH_INPUT = 'dictionary-search-input'

/**
 * Dictionary: searches all of CC-CEDICT (HSK 1-4 and the full dictionary). The
 * search and the filter live in the URL (/dictionary?q=果&kind=word), so the
 * back button returns to the same results and they can be shared.
 */
export function DictionaryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const urlQuery = searchParams.get('q') ?? ''
  // The search text lives here and the URL follows it. The URL changes through
  // a navigation, which arrives a bit later: if the input read from it, the
  // Chinese keyboard (IME) would lose what it is composing and duplicate the text.
  const [query, setQuery] = useState(urlQuery)
  // If the URL changes for another reason (a link, back), the URL wins
  const [locationKey, setLocationKey] = useState(location.key)
  if (location.key !== locationKey) {
    setLocationKey(location.key)
    if (location.state !== FROM_SEARCH_INPUT && urlQuery !== query) setQuery(urlQuery)
  }
  const kindParam = searchParams.get('kind')
  const kind: KindFilter = isKindFilter(kindParam) ? kindParam : 'all'

  const update = (changes: { q?: string; kind?: KindFilter }) => {
    const next = { q: query, kind, ...changes }
    setQuery(next.q)
    const params = new URLSearchParams()
    if (next.q !== '') params.set('q', next.q)
    if (next.kind !== 'all') params.set('kind', next.kind)
    // replace: typing does not fill the history with one entry per letter
    setSearchParams(params, { replace: true, state: FROM_SEARCH_INPUT })
  }

  return (
    <>
      <PageHeader title={t('nav.dictionary')} description={t('dictionary.description')} />
      <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <fieldset className="flex flex-wrap gap-2">
            <legend className="sr-only">{t('dictionary.kind.label')}</legend>
            {KIND_FILTERS.map((filter) => (
              <label
                key={filter.value}
                className="cursor-pointer rounded-full border border-line bg-surface px-3 py-1 text-sm has-checked:border-accent has-checked:bg-accent-soft has-checked:text-accent-strong has-focus-visible:outline-2 has-focus-visible:outline-accent"
              >
                <input
                  type="radio"
                  name="dictionary-kind"
                  value={filter.value}
                  checked={kind === filter.value}
                  onChange={() => update({ kind: filter.value })}
                  className="sr-only"
                />
                {t(filter.labelKey)}
              </label>
            ))}
          </fieldset>
          <DictionarySearch
            kind={kind === 'all' ? undefined : kind}
            query={query}
            onQueryChange={(q) => update({ q })}
            opener={{ getHref: getEntryPath }}
            listAllWhenEmpty
          />
        </div>
        <ToneLegend className="rounded-2xl border border-line bg-surface p-4 sm:p-5 lg:sticky lg:top-6 lg:w-72" />
      </div>
    </>
  )
}
