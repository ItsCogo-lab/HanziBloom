import { HanziText } from '../../../components/ui/HanziText.tsx'
import { t } from '../../../i18n/index.ts'
import { ExampleText } from '../../dictionary/components/ExampleSentences.tsx'
import { tatoebaSentenceUrl } from '../../dictionary/examples.ts'
import type { StudyItem } from '../../dictionary/studyItem.ts'
import { getGrammarPoints } from '../grammar.ts'

/**
 * Notas de gramática de una partícula (的, 了, 吗...). Si la entrada no es
 * una de ellas, no se muestra nada. Cada nota enlaza a su página de la
 * Chinese Grammar Wiki y cada frase, a Tatoeba.
 */
export function GrammarNotes({ item }: { item: StudyItem }) {
  const points = getGrammarPoints(item)
  if (points.length === 0) return null

  return (
    <section>
      <h2 className="mb-2 text-lg font-semibold">{t('grammar.title')}</h2>
      <ul className="flex flex-col gap-4">
        {points.map((point) => (
          <li key={point.id} className="rounded-xl border border-line p-4">
            <h3 className="font-semibold">{point.title}</h3>
            <p className="mt-1 text-accent-strong">
              <HanziText>{point.pattern}</HanziText>
            </p>
            <p className="mt-2">{point.explanation}</p>
            <ul className="mt-3 flex flex-col gap-3">
              {point.examples.map((example) => (
                <li key={example.tatoebaId}>
                  <ExampleText chinese={example.zh} />
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
            <p className="mt-3 text-sm">
              {t('grammar.learnMore')}{' '}
              <a href={point.reference.url} className="text-accent-strong underline underline-offset-2">
                {point.reference.title}
              </a>
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-ink-muted">{t('grammar.credits')}</p>
    </section>
  )
}
