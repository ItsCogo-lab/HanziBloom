import type { ComponentProps } from 'react'

/**
 * Texto en chino simplificado. El atributo `lang` hace que el navegador use
 * la fuente china correcta y que los lectores de pantalla lo pronuncien bien.
 */
export function HanziText({ className = '', ...props }: ComponentProps<'span'>) {
  return <span lang="zh-Hans" className={`font-hanzi ${className}`} {...props} />
}
