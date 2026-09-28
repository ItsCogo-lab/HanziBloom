import { useEffect, useRef, useState } from 'react'
import type HanziWriter from 'hanzi-writer'
import { Button } from '../../../components/ui/Button.tsx'
import { t } from '../../../i18n/index.ts'
import { loadStrokeData, type StrokeData } from '../strokeData.ts'

const SIZE = 180

/**
 * Orden de trazos con Hanzi Writer. Los trazos y la librería se cargan solo
 * al abrir la ficha; si no hay datos para el carácter, no se muestra nada.
 */
export function StrokeOrder({ hanzi }: { hanzi: string }) {
  // Se guarda con su carácter para no mostrar los trazos del anterior al cambiar de ficha
  const [loaded, setLoaded] = useState<{ hanzi: string; data: StrokeData }>()
  const data = loaded?.hanzi === hanzi ? loaded.data : undefined
  const targetRef = useRef<HTMLDivElement>(null)
  const writerRef = useRef<HanziWriter>(null)

  useEffect(() => {
    let cancelled = false
    loadStrokeData(hanzi).then(
      (strokeData) => !cancelled && setLoaded({ hanzi, data: strokeData }),
      () => {}, // Sin datos de trazos: la sección no aparece
    )
    return () => {
      cancelled = true
    }
  }, [hanzi])

  useEffect(() => {
    const target = targetRef.current
    if (!data || !target) return
    let cancelled = false
    import('hanzi-writer').then(({ default: Writer }) => {
      if (cancelled) return
      // Hanzi Writer pinta con colores fijos: tomamos los del tema de la página
      const color = getComputedStyle(target).color
      writerRef.current = Writer.create(target, hanzi, {
        width: SIZE,
        height: SIZE,
        padding: 8,
        strokeColor: color,
        radicalColor: getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim() || color,
        charDataLoader: () => data,
      })
    }, () => {})
    return () => {
      cancelled = true
      writerRef.current = null
      target.replaceChildren()
    }
  }, [data, hanzi])

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
