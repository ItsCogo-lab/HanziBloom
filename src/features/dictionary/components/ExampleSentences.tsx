import { useEffect, useState } from 'react'
import { HanziText } from '../../../components/ui/HanziText.tsx'
import { t } from '../../../i18n/index.ts'
import { getExamplesFor, loadExampleSet, tatoebaSentenceUrl } from '../examples.ts'
import { getStudyItemId, type StudyItem } from '../studyItem.ts'
import type { ExampleSet } from '../types.ts'

/**
 * Frases de ejemplo de Tatoeba, con enlace y autor de cada frase como pide su
 * licencia. Si no hay frases (o no se pueden cargar), no se muestra nada.
 */
export function ExampleSentences({ item }: { item: StudyItem }) {
  const level = item.entry.hskLevel
  // Se guarda con su nivel para no mezclar datos al cambiar de ficha
  const [loaded, setLoaded] = useState<{ level: number; set: ExampleSet }>()

  useEffect(() => {
    let cancelled = false
    loadExampleSet(level).then(
      (set) => !cancelled && setLoaded({ level, set }),
      () => {}, // Sin frases para este nivel: la sección no aparece
    )
    return () => {
      cancelled = true
    }
  }, [level])

  const examples = loaded?.level === level ? getExamplesFor(loaded.set, item) : []
  if (!loaded || examples.length === 0) return null

  return (
    <section>
      <h2 className="mb-2 text-lg font-semibold">{t('dictionary.examples')}</h2>
      <ul className="flex flex-col gap-4">
        {examples.map((example) => (
          <li key={`${getStudyItemId(item)}-${example.tatoebaId}`}>
            <HanziText className="text-xl">{example.zh}</HanziText>
            <p>{example.en}</p>
            <p className="text-sm text-ink-muted">
              <a
                href={tatoebaSentenceUrl(example.tatoebaId)}
                className="underline underline-offset-2 hover:text-accent-strong"
              >
                {t('dictionary.exampleAttribution', { id: example.tatoebaId, author: example.author })}
              </a>
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-ink-muted">
        {t('dictionary.examplesLicense', { license: loaded.set.license })}
      </p>
    </section>
  )
}
