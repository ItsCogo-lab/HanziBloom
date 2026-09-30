import { toToneNumbers } from '../../../lib/tones.ts'
import { useSettings } from '../../settings/settingsContext.ts'

/**
 * Pinyin with tone marks and, if the user has turned it on in Settings,
 * also with numbers: "nǐ hǎo (ni3 hao3)". It's the alternative to colors
 * for those who can't easily tell the marks apart.
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
