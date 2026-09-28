import type { Tone } from '../../lib/tones.ts'

/** Clase de color de cada tono (tokens --color-tone-* de index.css). Enteras para que Tailwind las encuentre. */
export const TONE_TEXT_CLASSES: Record<Tone, string> = {
  1: 'text-tone-1',
  2: 'text-tone-2',
  3: 'text-tone-3',
  4: 'text-tone-4',
  5: 'text-tone-5',
}
