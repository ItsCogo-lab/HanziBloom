import { getMeanings } from '../dictionary/dictionary.ts'
import { getStudyItemId, type StudyItem } from '../dictionary/studyItem.ts'
import { shuffle } from '../../lib/random.ts'
import type { ExerciseDefinition } from './exerciseDefinitions.ts'
import type { ChoiceExercise, ChoiceExerciseType } from './types.ts'

/** Opciones por pregunta: la correcta y tres distractores. */
export const CHOICE_OPTION_COUNT = 4

/** Longitud orientativa del texto de significado de una opción. */
const MAX_MEANING_LABEL_LENGTH = 40

// --- Textos que se muestran --------------------------------------------------

/**
 * Significados que se pueden mostrar sin revelar la respuesta. Algunas
 * entradas de CC-CEDICT citan el propio hanzi ("eldest (as in 大姐)"): se
 * quita el paréntesis que lo cita y, si aun así lo cita ("used in 漂亮"),
 * se descarta ese significado.
 */
export function getMeaningClues(item: StudyItem): string[] {
  const characters = Array.from(item.entry.hanzi)
  const mentionsHanzi = (text: string) => characters.some((character) => text.includes(character))

  return getMeanings(item.entry.meanings).flatMap((meaning) => {
    const cleaned = meaning.replace(/\s*\([^()]*\)/g, (group) => (mentionsHanzi(group) ? '' : group)).trim()
    return cleaned === '' || mentionsHanzi(cleaned) ? [] : [cleaned]
  })
}

/** Texto corto con los primeros significados: siempre el primero y, si caben, más. */
export function getMeaningLabel(item: StudyItem): string {
  const label: string[] = []
  for (const meaning of getMeaningClues(item)) {
    if (label.length > 0 && [...label, meaning].join('; ').length > MAX_MEANING_LABEL_LENGTH) break
    label.push(meaning)
  }
  return label.join('; ')
}

/** Lecturas de pinyin: una en las palabras; una o varias en los caracteres. */
export function getReadings(item: StudyItem): readonly string[] {
  return item.kind === 'word' ? [item.entry.pinyin] : item.entry.pinyin
}

/**
 * Pinyin de una opción. En los caracteres con varias lecturas (了: le, liǎo)
 * se muestra solo la primera: si la opción correcta fuera la única con una
 * lista, se adivinaría por el formato.
 */
export function getPinyinLabel(item: StudyItem): string {
  return getReadings(item)[0] ?? ''
}

// --- Cuándo dos elementos se confunden ----------------------------------------

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim()
}

/** Significados sueltos: "to love; to like (sth)" → "to love", "to like". */
function getGlosses(item: StudyItem): Set<string> {
  const glosses = getMeanings(item.entry.meanings)
    .flatMap((meaning) => meaning.split(';'))
    .map((gloss) => normalize(gloss.replace(/\([^()]*\)/g, '')))
  return new Set(glosses.filter((gloss) => gloss !== ''))
}

function sharesMeaning(a: StudyItem, b: StudyItem): boolean {
  const glossesOfA = getGlosses(a)
  return [...getGlosses(b)].some((gloss) => glossesOfA.has(gloss))
}

function sharesReading(a: StudyItem, b: StudyItem): boolean {
  const key = (pinyin: string) => pinyin.toLowerCase().replace(/\s+/g, '')
  const readingsOfA = new Set(getReadings(a).map(key))
  return getReadings(b).some((reading) => readingsOfA.has(key(reading)))
}

interface ChoiceRules {
  /** ¿Se puede preguntar por este elemento o usarlo como opción? */
  isUsable(item: StudyItem): boolean
  /**
   * ¿Serían ambiguos juntos en la misma pregunta? Si un distractor también
   * fuera una respuesta válida (un sinónimo, una lectura compartida), la
   * pregunta tendría dos respuestas correctas.
   */
  conflict(a: StudyItem, b: StudyItem): boolean
}

const hasMeaningLabel = (item: StudyItem) => getMeaningLabel(item) !== ''

const CHOICE_RULES: Record<ChoiceExerciseType, ChoiceRules> = {
  'meaning-choice': { isUsable: hasMeaningLabel, conflict: sharesMeaning },
  'pinyin-choice': { isUsable: () => true, conflict: sharesReading },
  'hanzi-choice': {
    isUsable: hasMeaningLabel,
    conflict: (a, b) => a.entry.hanzi === b.entry.hanzi || sharesMeaning(a, b),
  },
}

// --- Distractores y definiciones ---------------------------------------------

function hanziLength(item: StudyItem): number {
  return Array.from(item.entry.hanzi).length
}

/**
 * Elige los distractores (respuestas incorrectas) recorriendo `pool` en orden.
 * Solo usa elementos del mismo tipo (carácter o palabra) que no se confundan
 * con la respuesta ni entre sí. Prefiere los de la misma longitud: una palabra
 * de dos caracteres entre opciones de uno se adivinaría sin saberla.
 */
export function pickDistractors(
  type: ChoiceExerciseType,
  item: StudyItem,
  pool: readonly StudyItem[],
): StudyItem[] {
  const { isUsable, conflict } = CHOICE_RULES[type]
  const itemId = getStudyItemId(item)
  const length = hanziLength(item)

  const candidates = pool
    .filter((candidate) => candidate.kind === item.kind && getStudyItemId(candidate) !== itemId)
    .filter((candidate) => isUsable(candidate) && !conflict(item, candidate))
    // sort es estable: entre los de igual longitud se mantiene el orden de `pool`
    .sort((a, b) => Math.abs(hanziLength(a) - length) - Math.abs(hanziLength(b) - length))

  const distractors: StudyItem[] = []
  for (const candidate of candidates) {
    if (distractors.length === CHOICE_OPTION_COUNT - 1) break
    if (!distractors.some((distractor) => conflict(distractor, candidate))) distractors.push(candidate)
  }
  return distractors
}

function createChoiceDefinition(type: ChoiceExerciseType): ExerciseDefinition<ChoiceExercise> {
  return {
    type,
    canBuild: (item, pool) =>
      CHOICE_RULES[type].isUsable(item) && pickDistractors(type, item, pool).length === CHOICE_OPTION_COUNT - 1,
    build: (item, pool, random) => {
      // Se baraja el pool para que los distractores cambien de una sesión a otra
      const distractors = pickDistractors(type, item, shuffle(pool, random))
      return { type, item, options: shuffle([item, ...distractors], random) }
    },
  }
}

export const meaningChoiceDefinition = createChoiceDefinition('meaning-choice')
export const pinyinChoiceDefinition = createChoiceDefinition('pinyin-choice')
export const hanziChoiceDefinition = createChoiceDefinition('hanzi-choice')

/** ¿Es esta opción la respuesta correcta? */
export function isCorrectOption(exercise: ChoiceExercise, option: StudyItem): boolean {
  return getStudyItemId(option) === getStudyItemId(exercise.item)
}
