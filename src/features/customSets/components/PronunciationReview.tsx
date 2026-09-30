import { useId } from 'react'
import { t } from '../../../i18n/index.ts'
import { chooseReading } from '../sentences.ts'
import type { CustomSentence, SentenceToken } from '../types.ts'

/**
 * For each uncertain character of a sentence, a dropdown with its possible
 * readings (the pinyin engine's). The user picks one; they never type pinyin
 * by hand, so no made-up syllable slips in.
 */
export function PronunciationReview({
  sentence,
  onChange,
}: {
  sentence: CustomSentence
  onChange: (tokens: SentenceToken[]) => void
}) {
  const baseId = useId()
  const uncertain = sentence.tokens.flatMap((token, index) => (token.uncertain ? [{ token, index }] : []))
  if (uncertain.length === 0) return null

  return (
    <div className="flex flex-wrap gap-3">
      {uncertain.map(({ token, index }) => (
        <label key={index} htmlFor={`${baseId}-${index}`} className="flex items-center gap-2 text-sm">
          {t('custom.pronunciationOf', { hanzi: token.text })}
          <select
            id={`${baseId}-${index}`}
            value=""
            onChange={(event) => onChange(chooseReading(sentence.tokens, index, event.target.value))}
            className="rounded-lg border border-line bg-surface px-2 py-1"
          >
            <option value="" disabled>
              {t('custom.choose')}
            </option>
            {(token.candidates ?? []).map((reading) => (
              <option key={reading} value={reading}>
                {reading}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  )
}
