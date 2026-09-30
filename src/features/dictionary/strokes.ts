/**
 * File name of a character's strokes in public/strokes/: its code point
 * in hexadecimal (柠 → "67e0.json"). That way URLs don't contain Chinese
 * characters, which some servers and file systems handle poorly.
 */
export function strokeFileName(hanzi: string): string {
  return `${hanzi.codePointAt(0)!.toString(16)}.json`
}
