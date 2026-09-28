import { toToneNumbers } from '../../../lib/tones.ts'
import { useSettings } from '../../settings/settingsContext.ts'

/**
 * Pinyin con marcas de tono y, si el usuario lo ha activado en Ajustes,
 * también con números: "nǐ hǎo (ni3 hao3)". Es la alternativa a los colores
 * para quien no distingue bien las marcas.
 */
export function PinyinText({ pinyin, className = '' }: { pinyin: string; className?: string }) {
  const { toneNumbers } = useSettings().settings
  return (
    <span className={className}>
      {pinyin}
      {toneNumbers && <span className="text-ink-muted"> ({toToneNumbers(pinyin)})</span>}
    </span>
  )
}
