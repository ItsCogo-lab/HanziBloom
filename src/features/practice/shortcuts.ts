import { createContext, useContext, useEffect } from 'react'

/**
 * Whether session keyboard shortcuts are active. SessionFrame turns them off
 * while the dictionary panel is open, so typing a number there doesn't
 * answer the card underneath.
 */
export const ShortcutsEnabledContext = createContext(true)

/** Actions by key, as in `KeyboardEvent.key`: '1', ' ' (space), 'Enter'. */
export type Shortcuts = Partial<Record<string, () => void>>

/**
 * Keyboard shortcuts for a session exercise. Keys are ignored while typing
 * in a field, with a modifier (Ctrl+1 changes tabs) and, for Enter and
 * Space, when a button has focus: the browser already presses it.
 */
export function useSessionShortcuts(shortcuts: Shortcuts) {
  const enabled = useContext(ShortcutsEnabledContext)

  useEffect(() => {
    if (!enabled) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || event.altKey || event.ctrlKey || event.metaKey) return
      const target = event.target instanceof HTMLElement ? event.target : null
      if (target && isTextField(target)) return
      if ((event.key === 'Enter' || event.key === ' ') && target?.closest('button, a, summary')) return
      const action = shortcuts[event.key]
      if (!action) return
      event.preventDefault()
      action()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [enabled, shortcuts])
}

function isTextField(element: HTMLElement): boolean {
  return element.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName)
}
