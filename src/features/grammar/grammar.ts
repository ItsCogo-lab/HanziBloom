import { grammarPoints } from '../../data/grammar.ts'
import { removeToneMarks } from '../../lib/pinyin.ts'
import type { StudyItem } from '../dictionary/studyItem.ts'
import type { GrammarPoint } from './types.ts'

/**
 * Notas de gramática de una ficha.
 *
 * - Un carácter las muestra siempre: su ficha cubre todas sus lecturas.
 * - Una palabra, solo si se lee como la partícula (sin contar el tono): 得
 *   «de» sí, 得 «děi» (tener que) no; 过 «guò» sí, porque el 过 de
 *   experiencia es el mismo verbo sin tono.
 */
export function getGrammarPoints(item: StudyItem, points: readonly GrammarPoint[] = grammarPoints): GrammarPoint[] {
  return points.filter(
    (point) =>
      point.particle === item.entry.hanzi &&
      (item.kind === 'character' || removeToneMarks(item.entry.pinyin) === point.pinyin),
  )
}
