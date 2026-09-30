import { useId } from 'react'
import { t, type MessageKey } from '../../../i18n/index.ts'
import { TONES, type Tone } from '../../../lib/tones.ts'
import { TONE_TEXT_CLASSES } from '../toneClasses.ts'

const TONE_LABELS: Record<Tone, MessageKey> = {
  1: 'tones.tone1',
  2: 'tones.tone2',
  3: 'tones.tone3',
  4: 'tones.tone4',
  5: 'tones.neutral',
}

/** Example of each tone with the syllable "ma": mā, má, mǎ, mà, ma. */
const TONE_EXAMPLES: Record<Tone, string> = { 1: 'mā', 2: 'má', 3: 'mǎ', 4: 'mà', 5: 'ma' }

/**
 * Tone color legend. Each row states the tone in text, has a color swatch
 * and a pinyin example with its mark: it doesn't rely on telling colors
 * apart.
 */
export function ToneLegend({ className = '' }: { className?: string }) {
  const titleId = useId()
  return (
    <section aria-labelledby={titleId} className={className}>
      <h2 id={titleId} className="mb-2 font-semibold">
        {t('tones.title')}
      </h2>
      <ul className="flex flex-wrap gap-x-5 gap-y-2">
        {TONES.map((tone) => (
          <li key={tone} className="inline-flex items-center gap-2">
            <span aria-hidden="true" className={`size-3.5 rounded-full bg-current ${TONE_TEXT_CLASSES[tone]}`} />
            <span className={`font-medium ${TONE_TEXT_CLASSES[tone]}`}>{t(TONE_LABELS[tone])}</span>
            <span className="text-ink-muted">{TONE_EXAMPLES[tone]}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-sm text-ink-muted">{t('tones.explanation')}</p>
    </section>
  )
}
