import type { MatcherFunction } from '@testing-library/react'

/**
 * Finds Chinese text even when it is split across several elements: with
 * tone colors, 你好 is rendered as <span>你</span><span>好</span>.
 * Usage: screen.getByText(hanzi('你好')).
 */
export function hanzi(text: string): MatcherFunction {
  return (_content, element) => element?.getAttribute('lang') === 'zh-Hans' && element.textContent === text
}
