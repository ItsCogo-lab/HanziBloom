import { t, tCount } from '../../../i18n/index.ts'
import { toToneNumbers } from '../../../lib/tones.ts'
import { TONE_TEXT_CLASSES } from '../../dictionary/toneClasses.ts'
import { useSettings } from '../../settings/settingsContext.ts'
import { countUncertain } from '../sentences.ts'
import type { CustomSentence, SentenceToken } from '../types.ts'

/**
 * Una frase del usuario: el chino coloreado por tonos (el mismo sistema que
 * el resto de la app) y el pinyin siempre debajo, así el color nunca es la
 * única pista. La puntuación no lleva color, y un carácter dudoso tampoco:
 * se marca con «?».
 */
export function SentenceView({ sentence }: { sentence: CustomSentence }) {
  return <AnnotatedSentence tokens={sentence.tokens} />
}

/** Una frase ya pasada por el motor de pinyin; también la usan las frases de ejemplo del diccionario. */
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

/** La sílaba de un carácter (con «?» si es dudosa) o la puntuación tal cual, pegada a lo anterior. */
function PinyinPart({ token, first }: { token: SentenceToken; first: boolean }) {
  if (token.pinyin === undefined && !token.uncertain) {
    // Texto que no es chino: se mantiene, sin los espacios de alrededor
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
