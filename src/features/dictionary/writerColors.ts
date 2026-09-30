/**
 * Hanzi Writer draws with fixed colors: these are taken from the page
 * theme, so the drawing follows light and dark mode. `element`'s text color
 * is used for the strokes.
 */
export function getWriterColors(element: HTMLElement) {
  const color = getComputedStyle(element).color
  const token = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  const accent = token('--color-accent') || color
  return {
    strokeColor: color,
    drawingColor: color,
    radicalColor: accent,
    highlightColor: accent,
    // The default light gray outline would be too bright in the dark theme
    outlineColor: token('--color-line') || '#dddddd',
  }
}
