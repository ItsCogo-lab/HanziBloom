import { useEffect, useRef } from 'react'
import type HanziWriter from 'hanzi-writer'
import { Button } from '../../../components/ui/Button.tsx'
import { t } from '../../../i18n/index.ts'
import { useSettings } from '../../settings/settingsContext.ts'
import { useStrokeData } from '../useStrokeData.ts'
import { getWriterColors } from '../writerColors.ts'

const SIZE = 180

/**
 * Stroke order with Hanzi Writer. The strokes (through the dictionary
 * service) and the library load only when the entry page opens. If the source
 * doesn't have the character, nothing is shown; if it couldn't be fetched, it says so.
 */
export function StrokeOrder({ hanzi, hasLocalCopy }: { hanzi: string; hasLocalCopy: boolean }) {
  const strokes = useStrokeData(hanzi, hasLocalCopy)
  const data = strokes.status === 'ready' ? strokes.data : undefined
  const targetRef = useRef<HTMLDivElement>(null)
  const writerRef = useRef<HanziWriter>(null)
  // Changing theme recreates the drawing with the new colors
  const { theme } = useSettings()

  useEffect(() => {
    const target = targetRef.current
    if (!data || !target) return
    let cancelled = false
    import('hanzi-writer').then(
      ({ default: Writer }) => {
        if (cancelled) return
        writerRef.current = Writer.create(target, hanzi, {
          width: SIZE,
          height: SIZE,
          padding: 8,
          ...getWriterColors(target),
          charDataLoader: () => data,
        })
      },
      () => {},
    )
    return () => {
      cancelled = true
      writerRef.current = null
      target.replaceChildren()
    }
  }, [data, hanzi, theme])

  if (strokes.status === 'unavailable') {
    return (
      <section>
        <h2 className="mb-2 text-lg font-semibold">{t('dictionary.strokeOrder')}</h2>
        <p className="text-sm text-ink-muted">{t('dictionary.strokeOrderUnavailable')}</p>
      </section>
    )
  }
  if (!data) return null

  return (
    <section>
      <h2 className="mb-2 text-lg font-semibold">{t('dictionary.strokeOrder')}</h2>
      <div className="flex flex-wrap items-center gap-4">
        <div
          ref={targetRef}
          className="rounded-xl border border-line bg-paper text-ink"
          style={{ width: SIZE, height: SIZE }}
          role="img"
          aria-label={`${t('dictionary.strokeOrder')}: ${hanzi}`}
        />
        <Button variant="secondary" onClick={() => writerRef.current?.animateCharacter()}>
          {t('dictionary.animateStrokes')}
        </Button>
      </div>
    </section>
  )
}
