import { grammarPoints } from '../../data/grammar.ts'
import { removeToneMarks } from '../../lib/pinyin.ts'
import type { StudyItem } from '../dictionary/studyItem.ts'
import type { GrammarPoint } from './types.ts'

/**
 * Grammar notes for an entry.
 *
 * - A character always shows them: its entry covers all its readings.
 * - A word, only if it is read as the particle (ignoring tone): 得 "de"
 *   yes, 得 "děi" (to have to) no; 过 "guò" yes, because the experiential
 *   过 is the same verb without the tone.
 */
export function getGrammarPoints(item: StudyItem, points: readonly GrammarPoint[] = grammarPoints): GrammarPoint[] {
  return points.filter(
    (point) =>
      point.particle === item.entry.hanzi &&
      (item.kind === 'character' || removeToneMarks(item.entry.pinyin) === point.pinyin),
  )
}
