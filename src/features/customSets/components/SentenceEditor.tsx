import { useId, useState, type FormEvent } from 'react'
import { Button } from '../../../components/ui/Button.tsx'
import { t } from '../../../i18n/index.ts'
import { processSentence } from '../sentenceProcessing.ts'
import { MAX_SENTENCE_LENGTH, validateSentence, type SentenceProblem } from '../sentences.ts'
import type { CustomSentence } from '../types.ts'

type SentenceEditorProps = {
  initial?: string
  onSave: (sentence: Pick<CustomSentence, 'chinese' | 'tokens'>) => void
  onCancel: () => void
}

/** Formulario de una frase: el usuario solo escribe el chino; el resto se genera al guardar. */
export function SentenceEditor({ initial = '', onSave, onCancel }: SentenceEditorProps) {
  const [chinese, setChinese] = useState(initial)
  const [problem, setProblem] = useState<SentenceProblem | 'failed'>()
  const [processing, setProcessing] = useState(false)
  const inputId = useId()
  const hintId = useId()

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const result = validateSentence(chinese)
    if ('problem' in result) {
      setProblem(result.problem)
      return
    }
    setProblem(undefined)
    setProcessing(true)
    try {
      onSave({ chinese: result.chinese, tokens: await processSentence(result.chinese) })
    } catch {
      setProblem('failed')
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-sm font-medium">
        {t('custom.sentenceLabel')}
      </label>
      <textarea
        id={inputId}
        value={chinese}
        onChange={(event) => setChinese(event.target.value)}
        maxLength={MAX_SENTENCE_LENGTH}
        rows={2}
        lang="zh-Hans"
        autoFocus
        aria-describedby={hintId}
        className="w-full rounded-xl border border-line bg-surface px-3 py-2 font-hanzi text-lg"
      />
      <p id={hintId} className="text-sm text-ink-muted">
        {t('custom.sentenceHint')}
      </p>
      {problem && (
        <p role="alert" className="text-sm text-danger">
          {t(problem === 'failed' ? 'custom.processingFailed' : `custom.problem.${problem}`)}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" className="px-3 py-1.5 text-sm" disabled={processing}>
          {t('custom.save')}
        </Button>
        <Button variant="secondary" className="px-3 py-1.5 text-sm" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        {processing && (
          <span role="status" className="text-sm text-ink-muted">
            {t('custom.processing')}
          </span>
        )}
      </div>
    </form>
  )
}
