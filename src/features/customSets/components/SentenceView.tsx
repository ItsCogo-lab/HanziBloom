import { t, tCount } from '../../../i18n/index.ts'
import { toToneNumbers } from '../../../lib/tones.ts'
import { TONE_TEXT_CLASSES } from '../../dictionary/toneClasses.ts'
import { useSettings } from '../../settings/settingsContext.ts'
import { countUncertain } from '../sentences.ts'
import type { CustomSentence, SentenceToken } from '../types.ts'

/**
 * A user sentence: the Chinese colored by tone (the same system as the rest
 * of the app) and the pinyin always below, so color is never the only cue.
 * Punctuation has no color, and neither does an uncertain character: it is
 * marked with "?".
 */
export function SentenceView({ sentence }: { sentence: CustomSentence }) {
  return <AnnotatedSentence tokens={sentence.tokens} />
}

/** A sentence already run through the pinyin engine; also used by the dictionary's example sentences. */
export function AnnotatedSentence({ tokens }: { tokens: readonly SentenceToken[] }) {
  const { toneColors, toneNumbers } = useSettings().settings
  const uncertain = countUncertain(tokens)
  const pinyin = tokens.flatMap((token) => (token.pinyin ? [token.pinyin] : [])).join(' ')

  return (
    <div className="flex flex-col gap-0.5">
      <p lang="zh-Hans" className="font-hanzi text-xl">
        {tokens.map((token, index) =>
          toneColors && token.tone !== undefined && !token.uncertain ? (
            <span key={index} className={TONE_TEXT_CLASSES[token.tone]} data-tone={token.tone}>
              {token.text}
            </span>
          ) : (
            <span key={index}>{token.text}</span>
          ),
        )}
      </p>
      <p className="text-accent-strong">
        {tokens.map((token, index) => (
          <PinyinPart key={index} token={token} first={index === 0} />
        ))}
        {toneNumbers && pinyin && <span className="text-ink-muted"> ({toToneNumbers(pinyin)})</span>}
      </p>
      {uncertain > 0 && (
        <p className="text-sm text-ink-muted">{tCount(uncertain, 'custom.uncertainNoteOne', 'custom.uncertainNote')}</p>
      )}
    </div>
  )
}

/** The syllable of a character (with "?" if uncertain) or punctuation as is, attached to what comes before. */
function PinyinPart({ token, first }: { token: SentenceToken; first: boolean }) {
  if (token.pinyin === undefined && !token.uncertain) {
    // Non-Chinese text: kept, without the surrounding spaces
    return <>{token.text.trim() === '' ? ' ' : token.text.trim()}</>
  }
  const space = first ? '' : ' '
  if (!token.uncertain) return <>{`${space}${token.pinyin}`}</>
  return (
    <>
      {space}
      <span className="underline decoration-dotted underline-offset-4">
        {token.pinyin ?? '?'}
        <span aria-hidden="true">?</span>
        <span className="sr-only"> ({t('custom.uncertainMark')})</span>
      </span>
    </>
  )
}
