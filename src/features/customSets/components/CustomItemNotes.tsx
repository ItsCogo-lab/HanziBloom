import { useState } from 'react'
import { Button } from '../../../components/ui/Button.tsx'
import { t } from '../../../i18n/index.ts'
import { getStudyItemId, type StudyItem } from '../../dictionary/studyItem.ts'
import { useCustomSets } from '../customSetsContext.ts'
import type { CustomSentence, CustomSet } from '../types.ts'
import { getItemSentences } from '../sentences.ts'
import { MeaningEditor } from './MeaningEditor.tsx'
import { SentenceEditor } from './SentenceEditor.tsx'
import { PronunciationReview } from './PronunciationReview.tsx'
import { SentenceView } from './SentenceView.tsx'

const small = 'px-3 py-1.5 text-sm'

/** Notas de un elemento en un set propio, editables: su significado propio y sus frases. */
export function CustomItemNotes({ set, item }: { set: CustomSet; item: StudyItem }) {
  return (
    <div className="flex flex-col gap-3">
      <MeaningNote set={set} item={item} />
      <SentenceNotes set={set} item={item} />
    </div>
  )
}

function MeaningNote({ set, item }: { set: CustomSet; item: StudyItem }) {
  const { setMeaning, deleteMeaning } = useCustomSets()
  const [editingMeaning, setEditingMeaning] = useState(false)
  const itemId = getStudyItemId(item)
  const meaning = set.meanings[itemId]

  if (editingMeaning) {
    return (
      <MeaningEditor
        item={item}
        initial={meaning ?? ''}
        onSave={(value) => {
          setMeaning(set.id, itemId, value)
          setEditingMeaning(false)
        }}
        onCancel={() => setEditingMeaning(false)}
      />
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {meaning !== undefined && (
        <p>
          <span className="text-sm font-medium text-ink-muted">{t('custom.myMeaning')}:</span> {meaning}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" className={small} onClick={() => setEditingMeaning(true)}>
          {t(meaning === undefined ? 'custom.addMeaning' : 'custom.editMeaning')}
        </Button>
        {meaning !== undefined && (
          <Button variant="secondary" className={small} onClick={() => deleteMeaning(set.id, itemId)}>
            {t('custom.deleteMeaning')}
          </Button>
        )}
      </div>
    </div>
  )
}

function SentenceNotes({ set, item }: { set: CustomSet; item: StudyItem }) {
  const { addSentence } = useCustomSets()
  const [adding, setAdding] = useState(false)
  const itemId = getStudyItemId(item)
  const sentences = getItemSentences(set, itemId)

  return (
    <div className="flex flex-col gap-2">
      {sentences.length > 0 && (
        <>
          <h3 className="text-sm font-medium text-ink-muted">{t('custom.mySentences')}</h3>
          <ul className="flex flex-col gap-3">
            {sentences.map((sentence) => (
              <li key={sentence.id} className="rounded-xl bg-paper p-3">
                <SentenceNote set={set} sentence={sentence} />
              </li>
            ))}
          </ul>
        </>
      )}
      {adding ? (
        <SentenceEditor
          onSave={(sentence) => {
            addSentence(set.id, { ...sentence, itemId })
            setAdding(false)
          }}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <Button variant="secondary" className={`${small} self-start`} onClick={() => setAdding(true)}>
          {t('custom.addSentence')}
        </Button>
      )}
    </div>
  )
}

/** Una frase del set: se ve con su pinyin y tonos, y se puede editar, borrar o revisar su pronunciación. */
function SentenceNote({ set, sentence }: { set: CustomSet; sentence: CustomSentence }) {
  const { updateSentence, deleteSentence } = useCustomSets()
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <SentenceEditor
        initial={sentence.chinese}
        onSave={(change) => {
          updateSentence(set.id, sentence.id, change)
          setEditing(false)
        }}
        onCancel={() => setEditing(false)}
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <SentenceView sentence={sentence} />
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className={small}
            aria-label={t('custom.editSentenceNamed', { chinese: sentence.chinese })}
            onClick={() => setEditing(true)}
          >
            {t('custom.editSentence')}
          </Button>
          <Button
            variant="secondary"
            className={small}
            aria-label={t('custom.deleteSentenceNamed', { chinese: sentence.chinese })}
            onClick={() => deleteSentence(set.id, sentence.id)}
          >
            {t('custom.deleteSentence')}
          </Button>
        </div>
      </div>
      <PronunciationReview
        sentence={sentence}
        onChange={(tokens) => updateSentence(set.id, sentence.id, { chinese: sentence.chinese, tokens })}
      />
    </div>
  )
}
