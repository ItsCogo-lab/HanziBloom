import { Link } from 'react-router'
import { Card } from '../../../components/ui/Card.tsx'
import { HanziText } from '../../../components/ui/HanziText.tsx'
import { t } from '../../../i18n/index.ts'
import { formatPinyin, getMeanings, type Dictionary } from '../dictionary.ts'
import { getRelatedItems, getStudyItemId, type StudyItem } from '../studyItem.ts'
import { EntryLabel } from './EntryLabel.tsx'

type EntryDetailsProps = {
  item: StudyItem
  dictionary: Dictionary
  /** Ruta de la ficha de los elementos relacionados. */
  getHref: (item: StudyItem) => string
}

/** Ficha de un carácter o una palabra: pinyin, todos los significados y elementos relacionados. */
export function EntryDetails({ item, dictionary, getHref }: EntryDetailsProps) {
  const related = getRelatedItems(dictionary, item)

  return (
    <Card className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <HanziText className="text-7xl leading-tight sm:text-8xl">{item.entry.hanzi}</HanziText>
        <p className="text-2xl font-medium text-accent-strong">{formatPinyin(item.entry)}</p>
      </div>

      <section>
        <h2 className="mb-2 text-lg font-semibold">{t('dictionary.meanings')}</h2>
        <ul className="list-disc space-y-1 pl-5">
          {getMeanings(item.entry.meanings).map((meaning) => (
            <li key={meaning}>{meaning}</li>
          ))}
        </ul>
      </section>

      {related.length > 0 && (
        <section>
          <h2 className="mb-2 text-lg font-semibold">
            {t(item.kind === 'word' ? 'practice.charactersInWord' : 'practice.wordsWithCharacter')}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {related.map((relatedItem) => (
              <li key={getStudyItemId(relatedItem)}>
                <Link
                  to={getHref(relatedItem)}
                  className="inline-block rounded-lg border border-line bg-paper px-3 py-1.5 hover:border-accent"
                >
                  <EntryLabel entry={relatedItem.entry} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Card>
  )
}
