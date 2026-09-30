import type { ReactNode } from 'react'
import { Link } from 'react-router'
import type { StudyItem } from '../studyItem.ts'

/**
 * What to do when a character or word is pressed inside an entry page:
 * - `getHref`: go to its page (the normal entry page, /characters/好).
 * - `onOpen`: open it in place, without changing page (the study
 *   session's dictionary, which must not leave the session).
 */
export type EntryOpener = { getHref: (item: StudyItem) => string } | { onOpen: (item: StudyItem) => void }

type EntryLinkProps = {
  item: StudyItem
  opener: EntryOpener
  className?: string
  /** A second link to an entry that's already linked nearby: hidden from keyboards and screen readers. */
  decorative?: boolean
  children: ReactNode
}

/** A link to an entry page, or a button if the entry opens without navigating. */
export function EntryLink({ item, opener, className, decorative = false, children }: EntryLinkProps) {
  const hidden = decorative ? ({ tabIndex: -1, 'aria-hidden': true } as const) : {}
  if ('onOpen' in opener) {
    return (
      <button type="button" className={`text-left ${className ?? ''}`} onClick={() => opener.onOpen(item)} {...hidden}>
        {children}
      </button>
    )
  }
  return (
    <Link to={opener.getHref(item)} className={className} {...hidden}>
      {children}
    </Link>
  )
}
