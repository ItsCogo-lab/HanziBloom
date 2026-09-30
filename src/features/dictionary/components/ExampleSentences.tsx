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
 * Example sentences from Tatoeba, with their pinyin and each sentence's link
 * and author as its license requires. Requested from the dictionary service when the entry page opens (Tatoeba at
 * runtime, or the local HSK sentences). If there are no sentences, nothing
 * is shown; if they couldn't be fetched, it says so.
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
 * The sentence with its pinyin. The Tatoeba API doesn't give transcriptions, so
 * the same engine as for custom sentences is used (pinyin-pro checked against
 * CC-CEDICT): whatever it can't be sure of is marked with "?" and no color.
 * While the engine loads, or if it fails, only the Chinese is shown.
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
