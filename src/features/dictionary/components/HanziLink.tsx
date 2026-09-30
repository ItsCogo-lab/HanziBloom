import { HanziText } from '../../../components/ui/HanziText.tsx'
import { formatPinyin, getCharacter, type Dictionary } from '../dictionary.ts'
import { ToneHanzi } from './ToneHanzi.tsx'
import { EntryLink, type EntryOpener } from './EntryLink.tsx'

type HanziLinkProps = {
  hanzi: string
  dictionary: Dictionary
  opener: EntryOpener
}

/**
 * A character mentioned on another entry page (radical, component...). If it's
 * in the dictionary, links to its entry page and shows its pinyin; if not, just the hanzi.
 */
export function HanziLink({ hanzi, dictionary, opener }: HanziLinkProps) {
  const character = getCharacter(dictionary, hanzi)
  if (!character) return <HanziText className="text-xl">{hanzi}</HanziText>
  return (
    <EntryLink
      item={{ kind: 'character', entry: character }}
      opener={opener}
      className="inline-flex items-baseline gap-1.5 hover:text-accent-strong"
    >
      <ToneHanzi entry={character} className="text-xl" />
      <span className="text-sm text-accent-strong">{formatPinyin(character)}</span>
    </EntryLink>
  )
}
