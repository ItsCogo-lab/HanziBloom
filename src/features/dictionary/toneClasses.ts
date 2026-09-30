import type { Tone } from '../../lib/tones.ts'

/** Color class for each tone (--color-tone-* tokens in index.css). Written out in full so Tailwind finds them. */
export const TONE_TEXT_CLASSES: Record<Tone, string> = {
  1: 'text-tone-1',
  2: 'text-tone-2',
  3: 'text-tone-3',
  4: 'text-tone-4',
  5: 'text-tone-5',
}
