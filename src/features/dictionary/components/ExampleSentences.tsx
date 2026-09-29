import { useEffect, useState } from 'react'
import { HanziText } from '../../../components/ui/HanziText.tsx'
import { AnnotatedSentence } from '../../customSets/components/SentenceView.tsx'
import { processSentence } from '../../customSets/sentenceProcessing.ts'
import type { SentenceToken } from '../../customSets/types.ts'
import { t } from '../../../i18n/index.ts'
import { tatoebaSentenceUrl } from '../examples.ts'
import { loadExamples, type Examples } from '../runtime/dictionaryService.ts'
import { useRuntimeData } from '../runtime/runtimeSourcesContext.ts'
import { getStudyItemId, type StudyItem } from '../studyItem.ts'

/**
 * Frases de ejemplo de Tatoeba, con su pinyin y con enlace y autor de cada
 * frase como pide su licencia. Se piden al servicio del diccionario al abrir la ficha (Tatoeba en
 * tiempo de ejecución, o las frases locales de HSK). Si no hay frases, no se
 * muestra nada; si no se han podido consultar, se dice.
 */
export function ExampleSentences({ item }: { item: StudyItem }) {
  const itemId = getStudyItemId(item)
  const examples = useRuntimeData<Examples>(itemId, (sources, options) => loadExamples(sources, item, options))

  if (examples.status === 'unavailable') {
    return (
      <section>
        <h2 className="mb-2 text-lg font-semibold">{t('dictionary.examples')}</h2>
        <p className="text-sm text-ink-muted">{t('dictionary.examplesUnavailable')}</p>
      </section>
    )
  }
  if (examples.status !== 'ready') return null
  const { sentences, license } = examples.data

  return (
    <section>
      <h2 className="mb-2 text-lg font-semibold">{t('dictionary.examples')}</h2>
      <ul className="flex flex-col gap-4">
        {sentences.map((example) => (
          <li key={`${itemId}-${example.tatoebaId}`}>
            <ExampleText chinese={example.zh} />
            <p>{example.en}</p>
            <p className="text-sm text-ink-muted">
              <a
                href={tatoebaSentenceUrl(example.tatoebaId)}
                className="underline underline-offset-2 hover:text-accent-strong"
              >
                {t('dictionary.exampleAttribution', {
                  id: example.tatoebaId,
                  author: example.author,
                })}
              </a>
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-ink-muted">{t('dictionary.examplesLicense', { license })}</p>
    </section>
  )
}

/**
 * La frase con su pinyin. La API de Tatoeba no da transcripciones, así que se
 * usa el mismo motor que en las frases propias (pinyin-pro comprobado con
 * CC-CEDICT): lo que no puede asegurar sale marcado con «?» y sin color.
 * Mientras se carga el motor, o si falla, se ve solo el chino.
 */
export function ExampleText({ chinese }: { chinese: string }) {
  const [annotated, setAnnotated] = useState<{ chinese: string; tokens: SentenceToken[] }>()
  useEffect(() => {
    let active = true
    processSentence(chinese).then(
      (tokens) => active && setAnnotated({ chinese, tokens }),
      () => {},
    )
    return () => {
      active = false
    }
  }, [chinese])

  if (annotated?.chinese === chinese) return <AnnotatedSentence tokens={annotated.tokens} />
  return <HanziText className="text-xl">{chinese}</HanziText>
}
