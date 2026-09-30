import { t, tCount } from '../../../i18n/index.ts'
import { countSetItems } from '../studySets.ts'
import type { StudySet } from '../types.ts'

/** "150 words · 178 characters" */
export function SetItemCount({ set }: { set: StudySet }) {
  const { words, characters } = countSetItems(set)
  const parts = [
    words > 0 && tCount(words, 'sets.wordCountOne', 'sets.wordCount'),
    characters > 0 && tCount(characters, 'sets.characterCountOne', 'sets.characterCount'),
  ].filter((part) => part !== false)
  return <>{parts.join(' · ')}</>
}

/** "Studying" label for the sets that are in My Studies. */
export function StudyingBadge() {
  return (
    <span className="inline-block shrink-0 rounded-full border border-success/40 bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
      {t('sets.studying')}
    </span>
  )
}
