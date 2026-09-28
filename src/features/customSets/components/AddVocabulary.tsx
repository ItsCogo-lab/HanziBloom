import { useId, useState } from 'react'
import { Button } from '../../../components/ui/Button.tsx'
import { t } from '../../../i18n/index.ts'
import { EntryLabel } from '../../dictionary/components/EntryLabel.tsx'
import { hskStudyItems } from '../../dictionary/hskDictionary.ts'
import { searchItems } from '../../dictionary/search.ts'
import { getStudyItemId } from '../../dictionary/studyItem.ts'
import type { StudySet } from '../../studySets/types.ts'
import { useCustomSets } from '../customSetsContext.ts'

/** Resultados que se muestran como mucho; para ver otros, se afina la búsqueda. */
const RESULT_LIMIT = 20

/**
 * Buscador para añadir elementos a un set propio. Usa la misma búsqueda que
 * el diccionario y añade el id del elemento: nunca una copia.
 */
export function AddVocabulary({ set }: { set: StudySet }) {
  const { addItem } = useCustomSets()
  const [query, setQuery] = useState('')
  const inputId = useId()
  const results = query.trim() === '' ? [] : searchItems(hskStudyItems, query, RESULT_LIMIT)

  return (
    <section aria-labelledby={`${inputId}-title`} className="flex flex-col gap-3">
      <h2 id={`${inputId}-title`} className="text-lg font-semibold">
        {t('custom.addVocabulary')}
      </h2>
      <p className="text-sm text-ink-muted">{t('custom.addHint')}</p>
      <label htmlFor={inputId} className="sr-only">
        {t('dictionary.search')}
      </label>
      <input
        id={inputId}
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t('dictionary.searchPlaceholder')}
        autoComplete="off"
        className="w-full rounded-xl border border-line bg-surface px-4 py-2.5"
      />
      {results.length > 0 && (
        <ul aria-label={t('dictionary.results')} className="divide-y divide-line rounded-2xl border border-line bg-surface">
          {results.map((item) => {
            const itemId = getStudyItemId(item)
            const inSet = set.itemIds.includes(itemId)
            return (
              <li key={itemId} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <EntryLabel entry={item.entry} withMeaning />
                {inSet ? (
                  <span className="shrink-0 text-sm text-ink-muted">{t('custom.inSet')}</span>
                ) : (
                  <Button
                    variant="secondary"
                    className="shrink-0 px-3 py-1.5 text-sm"
                    aria-label={t('custom.addNamed', { hanzi: item.entry.hanzi })}
                    onClick={() => addItem(set.id, itemId)}
                  >
                    {t('custom.add')}
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
