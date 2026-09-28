import { Card } from '../../../components/ui/Card.tsx'
import { HanziText } from '../../../components/ui/HanziText.tsx'
import { t } from '../../../i18n/index.ts'
import { formatPinyin, getMeanings, getTraditionalForms, type Dictionary } from '../dictionary.ts'
import { getRelatedItems, getStudyItemId, type StudyItem } from '../studyItem.ts'
import { CharacterFacts } from './CharacterFacts.tsx'
import { EntryLabel } from './EntryLabel.tsx'
import { PinyinText } from './PinyinText.tsx'
import { ToneHanzi } from './ToneHanzi.tsx'
import { EntryLink, type EntryOpener } from './EntryLink.tsx'
import { ExampleSentences } from './ExampleSentences.tsx'
import { StrokeOrder } from './StrokeOrder.tsx'

type EntryDetailsProps = {
  item: StudyItem
  dictionary: Dictionary
  /** Qué hacer al pulsar un elemento relacionado: ir a su página o abrirlo aquí mismo. */
  opener: EntryOpener
}

/**
 * Ficha de un carácter o una palabra. Solo muestra las secciones de las que
 * hay datos: si una fuente no tiene un dato, la sección no aparece.
 */
export function EntryDetails({ item, dictionary, opener }: EntryDetailsProps) {
  const related = getRelatedItems(dictionary, item)
  const traditional = getTraditionalForms(item.entry)

  return (
    <Card className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <ToneHanzi entry={item.entry} className="text-7xl leading-tight sm:text-8xl" />
        <p className="text-2xl font-medium text-accent-strong">
          <PinyinText pinyin={formatPinyin(item.entry)} />
        </p>
        {item.kind === 'word' && traditional.length > 0 && (
          <p className="text-ink-muted">
            {t('dictionary.traditional')}{' '}
            <HanziText lang="zh-Hant" className="text-xl text-ink">
              {traditional.join(' ')}
            </HanziText>
          </p>
        )}
      </div>

      <section>
        <h2 className="mb-2 text-lg font-semibold">{t('dictionary.meanings')}</h2>
        <ul className="list-disc space-y-1 pl-5">
          {getMeanings(item.entry.meanings).map((meaning) => (
            <li key={meaning}>{meaning}</li>
          ))}
        </ul>
      </section>

      {item.kind === 'character' && (
        <>
          <CharacterFacts character={item.entry} dictionary={dictionary} opener={opener} />
          <StrokeOrder hanzi={item.entry.hanzi} />
        </>
      )}

      {related.length > 0 && (
        <section>
          <h2 className="mb-2 text-lg font-semibold">
            {t(item.kind === 'word' ? 'practice.charactersInWord' : 'practice.wordsWithCharacter')}
          </h2>
          {item.kind === 'word' ? (
            <ul className="flex flex-wrap gap-2">
              {related.map((relatedItem) => (
                <li key={getStudyItemId(relatedItem)}>
                  <EntryLink
                    item={relatedItem}
                    opener={opener}
                    className="inline-block rounded-lg border border-line bg-paper px-3 py-1.5 hover:border-accent"
                  >
                    <EntryLabel entry={relatedItem.entry} />
                  </EntryLink>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="divide-y divide-line rounded-xl border border-line">
              {related.map((relatedItem) => (
                <li key={getStudyItemId(relatedItem)}>
                  <RelatedWord item={relatedItem} opener={opener} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <ExampleSentences item={item} />
    </Card>
  )
}

/** Una palabra relacionada: hanzi, tradicional, pinyin, significado y nivel. */
function RelatedWord({ item, opener }: { item: StudyItem; opener: EntryOpener }) {
  const traditional = getTraditionalForms(item.entry)
  return (
    <EntryLink item={item} opener={opener} className="flex w-full flex-wrap items-baseline gap-x-3 gap-y-1 px-3 py-2 hover:bg-paper">
      <ToneHanzi entry={item.entry} className="text-xl" />
      {traditional.length > 0 && (
        <HanziText lang="zh-Hant" className="text-ink-muted">
          {traditional.join(' ')}
        </HanziText>
      )}
      <PinyinText pinyin={formatPinyin(item.entry)} className="text-accent-strong" />
      <span className="min-w-0 flex-1 text-ink-muted">{getMeanings(item.entry.meanings)[0]}</span>
      <span className="text-sm text-ink-muted">{t('dictionary.hskLevelValue', { level: item.entry.hskLevel })}</span>
    </EntryLink>
  )
}
