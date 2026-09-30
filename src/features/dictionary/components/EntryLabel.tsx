import { formatPinyin, getMeanings } from '../dictionary.ts'
import type { Character, Word } from '../types.ts'
import { PinyinText } from './PinyinText.tsx'
import { ToneHanzi } from './ToneHanzi.tsx'

type EntryLabelProps = {
  entry: Character | Word
  /** Adds the first meaning after the pinyin. */
  withMeaning?: boolean
}

/** Hanzi and pinyin (and optionally the meaning) on one line, for lists and tables. */
export function EntryLabel({ entry, withMeaning = false }: EntryLabelProps) {
  // The {' '} separate the words when read aloud; gap provides the visual spacing
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2">
      <ToneHanzi entry={entry} className="text-xl" />{' '}
      <PinyinText pinyin={formatPinyin(entry)} className="text-accent-strong" />
      {withMeaning && (
        <>
          {' '}
          <span className="text-ink-muted">{getMeanings(entry.meanings)[0]}</span>
        </>
      )}
    </span>
  )
}
