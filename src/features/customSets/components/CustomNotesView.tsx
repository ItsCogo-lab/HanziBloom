import { Card } from '../../../components/ui/Card.tsx'
import { t } from '../../../i18n/index.ts'
import { getStudyItemId, type StudyItem } from '../../dictionary/studyItem.ts'
import { getItemSentences } from '../sentences.ts'
import type { CustomSet } from '../types.ts'
import { SentenceView } from './SentenceView.tsx'

/**
 * Las notas del usuario sobre un elemento en un set propio, para leerlas
 * junto a la ficha del diccionario (que no cambia). Si no hay notas, nada.
 */
export function CustomNotesView({ set, item }: { set: CustomSet; item: StudyItem }) {
  const itemId = getStudyItemId(item)
  const meaning = set.meanings[itemId]
  const sentences = getItemSentences(set, itemId)
  if (meaning === undefined && sentences.length === 0) return null
  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">{t('custom.notesIn', { name: set.name })}</h2>
        <p className="text-sm text-ink-muted">{t('custom.notesHint')}</p>
      </div>
      {meaning !== undefined && (
        <section>
          <h3 className="mb-1 font-medium">{t('custom.myCustomMeaning')}</h3>
          <p>{meaning}</p>
        </section>
      )}
      {sentences.length > 0 && (
        <section>
          <h3 className="mb-2 font-medium">{t('custom.myCustomSentences')}</h3>
          <ul className="flex flex-col gap-3">
            {sentences.map((sentence) => (
              <li key={sentence.id}>
                <SentenceView sentence={sentence} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </Card>
  )
}
