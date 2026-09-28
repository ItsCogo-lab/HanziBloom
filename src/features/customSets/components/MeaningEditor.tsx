import { useId, useState, type FormEvent } from 'react'
import { Button } from '../../../components/ui/Button.tsx'
import { t } from '../../../i18n/index.ts'
import type { StudyItem } from '../../dictionary/studyItem.ts'
import { MAX_MEANING_LENGTH, validateMeaning, type MeaningProblem } from '../customSets.ts'

type MeaningEditorProps = {
  item: StudyItem
  initial: string
  onSave: (meaning: string) => void
  onCancel: () => void
}

/** Formulario del significado propio de un elemento. */
export function MeaningEditor({ item, initial, onSave, onCancel }: MeaningEditorProps) {
  const [meaning, setMeaning] = useState(initial)
  const [problem, setProblem] = useState<MeaningProblem>()
  const inputId = useId()

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const result = validateMeaning(meaning)
    if ('problem' in result) setProblem(result.problem)
    else onSave(result.meaning)
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-sm font-medium">
        {t('custom.meaningFor', { hanzi: item.entry.hanzi })}
      </label>
      <input
        id={inputId}
        value={meaning}
        onChange={(event) => setMeaning(event.target.value)}
        maxLength={MAX_MEANING_LENGTH}
        autoFocus
        className="w-full rounded-xl border border-line bg-surface px-3 py-2"
      />
      {problem && (
        <p role="alert" className="text-sm text-danger">
          {t(`custom.problem.${problem}`)}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" className="px-3 py-1.5 text-sm">
          {t('custom.save')}
        </Button>
        <Button variant="secondary" className="px-3 py-1.5 text-sm" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
      </div>
    </form>
  )
}
