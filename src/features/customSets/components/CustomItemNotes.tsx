import { useState } from 'react'
import { Button } from '../../../components/ui/Button.tsx'
import { t } from '../../../i18n/index.ts'
import { getStudyItemId, type StudyItem } from '../../dictionary/studyItem.ts'
import { useCustomSets } from '../customSetsContext.ts'
import type { CustomSet } from '../types.ts'
import { MeaningEditor } from './MeaningEditor.tsx'

/** Notas de un elemento en un set propio, editables: su significado propio. */
export function CustomItemNotes({ set, item }: { set: CustomSet; item: StudyItem }) {
  const { setMeaning, deleteMeaning } = useCustomSets()
  const [editingMeaning, setEditingMeaning] = useState(false)
  const itemId = getStudyItemId(item)
  const meaning = set.meanings[itemId]
  const small = 'px-3 py-1.5 text-sm'

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
