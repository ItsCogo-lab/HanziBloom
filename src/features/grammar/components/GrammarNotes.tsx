import { HanziText } from '../../../components/ui/HanziText.tsx'
import { t } from '../../../i18n/index.ts'
import { ExampleText } from '../../dictionary/components/ExampleSentences.tsx'
import { tatoebaSentenceUrl } from '../../dictionary/examples.ts'
import type { StudyItem } from '../../dictionary/studyItem.ts'
import { getGrammarPoints } from '../grammar.ts'
import type { GrammarPoint } from '../types.ts'

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
      <h2 className="mb-3 text-lg font-semibold">{t('grammar.title')}</h2>
      <ul className="flex flex-col gap-4">
        {points.map((point) => (
          <li key={point.id}>
            <GrammarCard point={point} />
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-ink-muted">{t('grammar.credits')}</p>
    </section>
  )
}

/** Un uso de la partícula: cabecera, estructura, explicación, ejemplos y enlace. */
function GrammarCard({ point }: { point: GrammarPoint }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-accent/30 border-l-4 border-l-accent bg-accent-soft">
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-accent text-on-accent shadow-sm"
          >
            <HanziText className="text-2xl leading-none">{point.particle}</HanziText>
            <span className="text-xs leading-tight">{point.pinyin}</span>
          </span>
          <h3 className="text-lg leading-snug font-semibold text-accent-strong">{point.title}</h3>
        </div>
        <Pattern point={point} />
        <p className="leading-relaxed">{point.explanation}</p>
      </div>

      <ul className="divide-y divide-line border-t border-accent/20 bg-surface">
        {point.examples.map((example) => (
          <li key={example.tatoebaId} className="px-4 py-3">
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

      <p className="border-t border-line bg-surface px-4 py-3 text-sm">
        {t('grammar.learnMore')}{' '}
        <a href={point.reference.url} className="font-medium text-accent-strong underline underline-offset-2">
          {point.reference.title}
        </a>
      </p>
    </article>
  )
}

/**
 * La estructura como fórmula: "Verb + 了 + Object" se ve como piezas
 * separadas por «+», con la partícula resaltada.
 */
function Pattern({ point }: { point: GrammarPoint }) {
  const parts = point.pattern.split(' + ')
  return (
    <p className="flex flex-wrap items-center gap-1.5">
      <span className="sr-only">{point.pattern}</span>
      {parts.map((part, index) => (
        <span key={`${index}-${part}`} className="flex items-center gap-1.5" aria-hidden="true">
          {index > 0 && <span className="font-semibold text-accent">+</span>}
          <HanziText
            className={
              part.includes(point.particle)
                ? 'rounded-lg bg-accent px-2.5 py-1 font-semibold text-on-accent'
                : 'rounded-lg border border-accent/30 bg-surface px-2.5 py-1 text-ink'
            }
          >
            {part}
          </HanziText>
        </span>
      ))}
    </p>
  )
}
