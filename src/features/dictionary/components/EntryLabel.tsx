import { HanziText } from '../../../components/ui/HanziText.tsx'
import { formatPinyin, getMeanings } from '../dictionary.ts'
import type { Character, Word } from '../types.ts'

type EntryLabelProps = {
  entry: Character | Word
  /** Añade el primer significado detrás del pinyin. */
  withMeaning?: boolean
}

/** Hanzi y pinyin (y opcionalmente el significado) en una línea, para listas y tablas. */
export function EntryLabel({ entry, withMeaning = false }: EntryLabelProps) {
  // Los {' '} separan las palabras al leerlo en voz alta; el hueco visual lo pone gap
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2">
      <HanziText className="text-xl">{entry.hanzi}</HanziText>{' '}
      <span className="text-accent-strong">{formatPinyin(entry)}</span>
      {withMeaning && (
        <>
          {' '}
          <span className="text-ink-muted">{getMeanings(entry.meanings)[0]}</span>
        </>
      )}
    </span>
  )
}
