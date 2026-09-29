import { useEffect, useRef } from 'react'
import type HanziWriter from 'hanzi-writer'
import { Button } from '../../../components/ui/Button.tsx'
import { t } from '../../../i18n/index.ts'
import { useSettings } from '../../settings/settingsContext.ts'
import { loadStrokes } from '../runtime/dictionaryService.ts'
import type { StrokeData } from '../strokeData.ts'
import { useRuntimeData } from '../runtime/runtimeSourcesContext.ts'

const SIZE = 180

/**
 * Orden de trazos con Hanzi Writer. Los trazos (a través del servicio del
 * diccionario) y la librería se cargan solo al abrir la ficha. Si la fuente no
 * tiene el carácter, no se muestra nada; si no se ha podido consultar, se dice.
 */
export function StrokeOrder({ hanzi, hasLocalCopy }: { hanzi: string; hasLocalCopy: boolean }) {
  const strokes = useRuntimeData<StrokeData>(`${hanzi}|${hasLocalCopy}`, (sources, options) =>
    loadStrokes(sources, hanzi, hasLocalCopy, options),
  )
  const data = strokes.status === 'ready' ? strokes.data : undefined
  const targetRef = useRef<HTMLDivElement>(null)
  const writerRef = useRef<HanziWriter>(null)
  // Al cambiar de tema se vuelve a crear el dibujo con los nuevos colores
  const { theme } = useSettings()

  useEffect(() => {
    const target = targetRef.current
    if (!data || !target) return
    let cancelled = false
    import('hanzi-writer').then(
      ({ default: Writer }) => {
        if (cancelled) return
        // Hanzi Writer pinta con colores fijos: tomamos los del tema de la página
        const color = getComputedStyle(target).color
        const token = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()
        writerRef.current = Writer.create(target, hanzi, {
          width: SIZE,
          height: SIZE,
          padding: 8,
          strokeColor: color,
          radicalColor: token('--color-accent') || color,
          // El contorno gris claro por defecto brillaría demasiado en el tema oscuro
          outlineColor: token('--color-line') || '#dddddd',
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
