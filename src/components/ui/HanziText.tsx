import type { ComponentProps } from 'react'

/**
 * Simplified Chinese text. The `lang` attribute makes the browser use the
 * right Chinese font and screen readers pronounce it correctly.
 */
export function HanziText({ className = '', ...props }: ComponentProps<'span'>) {
  return <span lang="zh-Hans" className={`font-hanzi ${className}`} {...props} />
}
