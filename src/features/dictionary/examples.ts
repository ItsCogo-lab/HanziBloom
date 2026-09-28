import type { StudyItem } from './studyItem.ts'
import type { ExampleSentence, ExampleSet, HskLevel } from './types.ts'

/** Frases de ejemplo que se muestran como máximo en una ficha. */
export const MAX_EXAMPLES_SHOWN = 3

/**
 * Carga las frases de ejemplo de un nivel (public/examples/hsk1.json, que
 * genera `npm run data:build` a partir de Tatoeba). Se piden al abrir una
 * ficha para no cargar todas las frases al arrancar la app.
 */
export async function loadExampleSet(level: HskLevel, fetchFn: typeof fetch = fetch): Promise<ExampleSet> {
  const response = await fetchFn(`${import.meta.env.BASE_URL}examples/hsk${level}.json`)
  if (!response.ok) throw new Error(`No examples for HSK ${level} (HTTP ${response.status})`)
  return (await response.json()) as ExampleSet
}

/**
 * Frases de una ficha: las elegidas para esa palabra o, en un carácter, las
 * de las palabras que lo contienen.
 */
export function getExamplesFor(set: ExampleSet, item: StudyItem): ExampleSentence[] {
  const matches =
    item.kind === 'word'
      ? (words: string[]) => words.includes(item.entry.hanzi)
      : (words: string[]) => words.some((word) => word.includes(item.entry.hanzi))
  return set.sentences.filter((sentence) => matches(sentence.words)).slice(0, MAX_EXAMPLES_SHOWN)
}

/** Página de una frase en Tatoeba, para atribuirla. */
export function tatoebaSentenceUrl(id: number): string {
  return `https://tatoeba.org/en/sentences/show/${id}`
}
