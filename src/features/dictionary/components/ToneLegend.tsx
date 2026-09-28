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

/** Ejemplo de cada tono con la sílaba "ma": mā, má, mǎ, mà, ma. */
const TONE_EXAMPLES: Record<Tone, string> = { 1: 'mā', 2: 'má', 3: 'mǎ', 4: 'mà', 5: 'ma' }

/**
 * Leyenda de colores de los tonos. Cada fila dice el tono con texto, lleva
 * una muestra del color y un ejemplo de pinyin con su marca: no depende de
 * distinguir los colores.
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
