import type { ReactNode } from 'react'
import { Link } from 'react-router'
import type { StudyItem } from '../studyItem.ts'

/**
 * Qué hacer al pulsar un carácter o una palabra dentro de una ficha:
 * - `getHref`: ir a su página (la ficha normal, /characters/好).
 * - `onOpen`: abrirla en el mismo sitio, sin cambiar de página (el
 *   diccionario de la sesión de estudio, que no debe salir de la sesión).
 */
export type EntryOpener = { getHref: (item: StudyItem) => string } | { onOpen: (item: StudyItem) => void }

type EntryLinkProps = {
  item: StudyItem
  opener: EntryOpener
  className?: string
  children: ReactNode
}

/** Un enlace a una ficha, o un botón si la ficha se abre sin navegar. */
export function EntryLink({ item, opener, className, children }: EntryLinkProps) {
  if ('onOpen' in opener) {
    return (
      <button type="button" className={`text-left ${className ?? ''}`} onClick={() => opener.onOpen(item)}>
        {children}
      </button>
    )
  }
  return (
    <Link to={opener.getHref(item)} className={className}>
      {children}
    </Link>
  )
}
