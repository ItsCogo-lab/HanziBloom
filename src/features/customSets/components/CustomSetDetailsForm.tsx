import { useId, useState, type FormEvent } from 'react'
import { Button } from '../../../components/ui/Button.tsx'
import { t } from '../../../i18n/index.ts'
import { MAX_DESCRIPTION_LENGTH, MAX_NAME_LENGTH, validateDetails, type DetailsProblem } from '../customSets.ts'
import type { CustomSetDetails } from '../types.ts'

type CustomSetDetailsFormProps = {
  initial?: CustomSetDetails
  submitLabel: string
  onSubmit: (details: CustomSetDetails) => void
  onCancel?: () => void
}

/** Nombre y descripción de un set: el mismo formulario para crear y para editar. */
export function CustomSetDetailsForm({ initial, submitLabel, onSubmit, onCancel }: CustomSetDetailsFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [problem, setProblem] = useState<DetailsProblem>()
  const nameId = useId()
  const descriptionId = useId()
  const problemId = useId()

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const result = validateDetails({ name, description })
    if ('problem' in result) setProblem(result.problem)
    else onSubmit(result.details)
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={nameId} className="font-medium">
          {t('custom.name')}
        </label>
        <input
          id={nameId}
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={MAX_NAME_LENGTH}
          required
          aria-invalid={problem === 'emptyName' || problem === 'nameTooLong'}
          aria-describedby={problem ? problemId : undefined}
          className="w-full rounded-xl border border-line bg-surface px-4 py-2.5"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={descriptionId} className="font-medium">
          {t('custom.description')}
        </label>
        <textarea
          id={descriptionId}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={MAX_DESCRIPTION_LENGTH}
          rows={2}
          className="w-full rounded-xl border border-line bg-surface px-4 py-2.5"
        />
      </div>
      {problem && (
        <p id={problemId} role="alert" className="text-danger">
          {t(`custom.problem.${problem}`)}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="submit">{submitLabel}</Button>
        {onCancel && (
          <Button variant="secondary" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
        )}
      </div>
    </form>
  )
}
