/**
 * Nombre del archivo de trazos de un carácter en public/strokes/: su punto de
 * código en hexadecimal (柠 → "67e0.json"). Así las URL no llevan caracteres
 * chinos, que algunos servidores y sistemas de archivos tratan mal.
 */
export function strokeFileName(hanzi: string): string {
  return `${hanzi.codePointAt(0)!.toString(16)}.json`
}
