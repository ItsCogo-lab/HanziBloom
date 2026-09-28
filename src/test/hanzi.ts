import type { MatcherFunction } from '@testing-library/react'

/**
 * Busca un texto en chino aunque esté partido en varios elementos: con los
 * colores de tono, 你好 se pinta como <span>你</span><span>好</span>.
 * Uso: screen.getByText(hanzi('你好')).
 */
export function hanzi(text: string): MatcherFunction {
  return (_content, element) => element?.getAttribute('lang') === 'zh-Hans' && element.textContent === text
}
