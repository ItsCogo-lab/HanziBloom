import { useEffect, useId, useRef, useState } from 'react'
import { Button } from '../../../components/ui/Button.tsx'
import { t } from '../../../i18n/index.ts'
import { useDictionary } from '../dictionaryContext.ts'
import type { StudyItem } from '../studyItem.ts'
import { DictionarySearch } from './DictionarySearch.tsx'
import { EntryDetails } from './EntryDetails.tsx'
import { ToneLegend } from './ToneLegend.tsx'

type DictionaryPanelProps = {
  /** Entry page opened directly (lookup from an exercise); without it, the search box. */
  initialItem?: StudyItem
  onClose: () => void
}

/**
 * Dictionary inside a study session: side panel on desktop and bottom
 * sheet on mobile. Everything happens in here, without changing page, so
 * the session (current question, answers, progress) stays intact underneath.
 *
 * Accessibility: it's a non-modal dialog. When it opens, focus goes to the search box
 * (or the entry page); Escape closes it and whatever opened it gets focus back.
 */
export function DictionaryPanel({ initialItem, onClose }: DictionaryPanelProps) {
  const titleId = useId()
  const dictionary = useDictionary()
  const [query, setQuery] = useState('')
  // Opened entry pages, like a history: "Back" returns to the previous one or to the search box
  const [history, setHistory] = useState<StudyItem[]>(initialItem ? [initialItem] : [])
  const current = history.at(-1)
  const searchRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (current) panelRef.current?.focus()
    else searchRef.current?.focus()
  }, [current])

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  const open = (item: StudyItem) => setHistory((items) => [...items, item])

  return (
    <div className="fixed inset-0 z-30 flex items-end md:pointer-events-none md:items-stretch md:justify-end">
      {/* On mobile, a backdrop that closes the sheet when tapped; on desktop the session stays in view */}
      <div aria-hidden="true" className="absolute inset-0 bg-backdrop md:hidden" onClick={onClose} />
      <section
        ref={panelRef}
        role="dialog"
        aria-modal="false"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="pointer-events-auto relative flex max-h-[85dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-line bg-paper shadow-xl outline-none md:max-h-none md:w-[28rem] md:rounded-none md:border-y-0 md:border-r-0"
      >
        <header className="flex items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3">
          <h2 id={titleId} className="text-lg font-semibold">
            {t('dictionary.panelTitle')}
          </h2>
          <Button variant="secondary" className="px-3 py-1.5 text-sm" onClick={onClose}>
            {t('dictionary.close')}
          </Button>
        </header>
        {/* On mobile the sheet reaches the screen edge: the bottom stays above the system bar */}
        <div className="flex flex-col gap-4 overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {current ? (
            <>
              <Button
                variant="secondary"
                className="self-start px-3 py-1.5 text-sm"
                onClick={() => setHistory((items) => items.slice(0, -1))}
              >
                {t(history.length > 1 ? 'dictionary.back' : 'dictionary.backToSearch')}
              </Button>
              <EntryDetails item={current} dictionary={dictionary} opener={{ onOpen: open }} />
            </>
          ) : (
            <>
              <DictionarySearch
                query={query}
                onQueryChange={setQuery}
                opener={{ onOpen: open }}
                inputRef={searchRef}
              />
              <ToneLegend className="rounded-2xl border border-line bg-surface p-4" />
            </>
          )}
        </div>
      </section>
    </div>
  )
}
