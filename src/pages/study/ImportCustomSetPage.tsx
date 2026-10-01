import { useId, useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '../../components/ui/Button.tsx'
import { Card } from '../../components/ui/Card.tsx'
import { PageHeader } from '../../components/ui/PageHeader.tsx'
import { CustomSetDetailsForm } from '../../features/customSets/components/CustomSetDetailsForm.tsx'
import { useCustomSets } from '../../features/customSets/customSetsContext.ts'
import {
  AI_PROMPT,
  matchImport,
  parseImport,
  type ImportMatch,
  type ImportProblem,
  type ParsedImport,
} from '../../features/customSets/importSet.ts'
import { EntryLabel } from '../../features/dictionary/components/EntryLabel.tsx'
import { useDictionary, useDictionaryStore } from '../../features/dictionary/dictionaryContext.ts'
import { getStudyItem } from '../../features/dictionary/studyItem.ts'
import { t, tCount } from '../../i18n/index.ts'

type Check =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'problem'; problem: ImportProblem }
  /** `offline`: the full dictionary didn't load, so only HSK words could be found. */
  | { status: 'done'; parsed: ParsedImport; match: ImportMatch; offline: boolean }

/**
 * Create a set from pasted text: JSON written by an AI (with the prompt
 * shown here) or a plain list of words. The words are looked up in the
 * dictionary and the user reviews them before creating the set.
 */
export function ImportCustomSetPage() {
  const { createSet } = useCustomSets()
  const store = useDictionaryStore()
  const dictionary = useDictionary()
  const navigate = useNavigate()
  const [text, setText] = useState('')
  const [check, setCheck] = useState<Check>({ status: 'idle' })
  const [copied, setCopied] = useState(false)
  const textId = useId()
  const promptId = useId()

  const runCheck = async () => {
    const result = parseImport(text)
    if ('problem' in result) {
      setCheck({ status: 'problem', problem: result.problem })
      return
    }
    setCheck({ status: 'checking' })
    const offline = await store.loadText(result.parsed.entries.map((entry) => entry.hanzi).join('')).then(
      () => false,
      () => true,
    )
    const match = matchImport(result.parsed.entries, store.wordIndex)
    setCheck({ status: 'done', parsed: result.parsed, match, offline })
  }

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(AI_PROMPT)
      setCopied(true)
    } catch {
      // No clipboard access: the prompt can still be selected by hand
    }
  }

  return (
    <>
      <PageHeader title={t('custom.importTitle')} description={t('custom.importIntro')} />
      <div className="flex max-w-2xl flex-col gap-4">
        <Card className="flex flex-col gap-3">
          <h2 id={`${promptId}-title`} className="text-lg font-semibold">
            {t('custom.importAiTitle')}
          </h2>
          <p className="text-sm text-ink-muted">{t('custom.importAiHint')}</p>
          <textarea
            id={promptId}
            aria-labelledby={`${promptId}-title`}
            readOnly
            value={AI_PROMPT}
            rows={10}
            onFocus={(event) => event.currentTarget.select()}
            className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 font-mono text-sm"
          />
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={copyPrompt}>
              {t('custom.copyPrompt')}
            </Button>
            {copied && (
              <span role="status" className="text-sm text-ink-muted">
                {t('custom.promptCopied')}
              </span>
            )}
          </div>
        </Card>

        <Card className="flex flex-col gap-3">
          <label htmlFor={textId} className="text-lg font-semibold">
            {t('custom.importPaste')}
          </label>
          <p className="text-sm text-ink-muted">{t('custom.importPasteHint')}</p>
          <textarea
            id={textId}
            value={text}
            onChange={(event) => {
              setText(event.target.value)
              setCheck({ status: 'idle' })
            }}
            rows={8}
            placeholder={'苹果, píng guǒ\n香蕉\n橙子'}
            className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 font-mono text-sm"
          />
          <div>
            <Button onClick={runCheck} disabled={check.status === 'checking'}>
              {t('custom.importCheck')}
            </Button>
          </div>
          {check.status === 'checking' && (
            <p role="status" className="text-sm text-ink-muted">
              {t('custom.importChecking')}
            </p>
          )}
          {check.status === 'problem' && (
            <p role="alert" className="text-danger">
              {t(`custom.importProblem.${check.problem}`)}
            </p>
          )}
        </Card>

        {check.status === 'done' && (
          <Card className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold">
              {t('custom.importFound', { found: check.match.itemIds.length, total: check.parsed.entries.length })}
            </h2>
            {check.match.itemIds.length > 0 && (
              <ul aria-label={t('custom.importFoundList')} className="flex flex-col gap-1.5">
                {check.match.itemIds.map((itemId) => {
                  const item = getStudyItem(dictionary, itemId)
                  return item && <li key={itemId}><EntryLabel entry={item.entry} withMeaning /></li>
                })}
              </ul>
            )}
            {check.match.notFound.length > 0 && (
              <p className="text-sm text-ink-muted">
                {t('custom.importNotFound', {
                  words: check.match.notFound.map((entry) => entry.hanzi).join('、'),
                })}
              </p>
            )}
            {check.offline && check.match.notFound.length > 0 && (
              <p role="alert" className="text-sm text-danger">
                {t('custom.importOffline')}
              </p>
            )}
            {check.match.itemIds.length > 0 && (
              <CustomSetDetailsForm
                key={JSON.stringify(check.parsed.details)}
                initial={{ name: check.parsed.details.name ?? '', description: check.parsed.details.description ?? '' }}
                submitLabel={tCount(check.match.itemIds.length, 'custom.importCreateOne', 'custom.importCreate')}
                onSubmit={(details) =>
                  navigate(`/study/sets/${encodeURIComponent(createSet(details, check.match.itemIds))}`)
                }
              />
            )}
          </Card>
        )}
      </div>
    </>
  )
}
