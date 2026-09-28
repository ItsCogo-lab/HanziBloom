import { useRef, useState, type ReactNode } from 'react'
import { Button } from '../../../components/ui/Button.tsx'
import { ProgressBar } from '../../../components/ui/ProgressBar.tsx'
import { t } from '../../../i18n/index.ts'
import { DictionaryPanel } from '../../dictionary/components/DictionaryPanel.tsx'
import type { Dictionary } from '../../dictionary/dictionary.ts'
import { getStudyItemId, type StudyItem } from '../../dictionary/studyItem.ts'

type SessionFrameProps = {
  /** Texto del avance, p. ej. "Card 3 of 10". */
  progressText: string
  value: number
  max: number
  dictionary: Dictionary
  /** Lo que se puede buscar en el diccionario de la sesión (todo el dataset). */
  dictionaryItems: readonly StudyItem[]
  /** El contenido recibe `lookUp` para abrir la ficha de un elemento en el panel. */
  children: (lookUp: (item: StudyItem) => void) => ReactNode
}

/**
 * Lo común a las sesiones Learn y Study: el avance, el botón Dictionary y el
 * panel del diccionario. El panel se abre encima de la sesión: el contenido
 * sigue montado debajo, con su estado, y al cerrar todo sigue igual.
 */
export function SessionFrame({ progressText, value, max, dictionary, dictionaryItems, children }: SessionFrameProps) {
  const [dictionaryOpen, setDictionaryOpen] = useState<{ item?: StudyItem }>()
  const dictionaryButtonRef = useRef<HTMLButtonElement>(null)

  const closeDictionary = () => {
    setDictionaryOpen(undefined)
    dictionaryButtonRef.current?.focus()
  }

  return (
    // Con el diccionario abierto en escritorio, la sesión se aparta a la izquierda para que se vean los dos
    <div className={dictionaryOpen ? 'md:pr-[28rem]' : undefined}>
      <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-ink-muted" aria-live="polite">
              {progressText}
            </p>
            <Button
              ref={dictionaryButtonRef}
              variant="secondary"
              className="px-3 py-1.5 text-sm"
              aria-expanded={dictionaryOpen !== undefined}
              onClick={() => (dictionaryOpen ? closeDictionary() : setDictionaryOpen({}))}
            >
              <span aria-hidden="true" className="font-hanzi">
                典
              </span>
              {t('dictionary.panelTitle')}
            </Button>
          </div>
          <ProgressBar value={value} max={max} label={progressText} />
        </div>
        {children((item) => setDictionaryOpen({ item }))}
      </div>
      {dictionaryOpen && (
        <DictionaryPanel
          // key: consultar otro elemento abre su ficha aunque el panel ya estuviera abierto
          key={dictionaryOpen.item ? getStudyItemId(dictionaryOpen.item) : 'search'}
          dictionary={dictionary}
          items={dictionaryItems}
          initialItem={dictionaryOpen.item}
          onClose={closeDictionary}
        />
      )}
    </div>
  )
}
