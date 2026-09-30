/**
 * The key that presses a button, shown inside it. Only with a mouse or
 * trackpad (pointer-fine): on a phone there is no keyboard to press it with.
 * Hidden from screen readers; the button carries it in `aria-keyshortcuts`.
 */
export function Kbd({ children }: { children: string }) {
  return (
    <kbd
      aria-hidden="true"
      className="hidden rounded border border-current/30 px-1.5 font-sans text-xs leading-5 opacity-70 pointer-fine:inline"
    >
      {children}
    </kbd>
  )
}
