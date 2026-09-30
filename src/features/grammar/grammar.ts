import { grammarPoints } from '../../data/grammar.ts'
import { removeToneMarks } from '../../lib/pinyin.ts'
import type { StudyItem } from '../dictionary/studyItem.ts'
import type { GrammarPoint } from './types.ts'

/**
 * Grammar notes for an entry.
 *
 * - A character always shows them: its entry covers all its readings.
 * - A word, only if it is read as in that use (ignoring tone): 得 "de"
 *   yes, 得 "děi" (to have to) no; 过 "guò" yes, because the experiential
 *   过 is the same verb without the tone.
 * - Entries listed in `alsoShownOn` always show it: 但是 shows 虽然...但是.
 */
export function getGrammarPoints(item: StudyItem, points: readonly GrammarPoint[] = grammarPoints): GrammarPoint[] {
  const { hanzi } = item.entry
  return points.filter(
    (point) =>
      (point.word === hanzi &&
        (item.kind === 'character' || removeToneMarks(item.entry.pinyin) === point.pinyin)) ||
      point.alsoShownOn?.includes(hanzi) === true,
  )
}
