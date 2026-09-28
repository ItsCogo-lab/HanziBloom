/**
 * Adaptador de la lista HSK 2.0 de clem109/hsk-vocabulary (MIT).
 *
 * Responsabilidad: qué palabras hay en cada nivel y su pinyin de examen.
 * Las traducciones de esta lista no se usan: los significados son de CC-CEDICT.
 */
export interface HskWord {
  hanzi: string
  /** Pinyin de examen con marcas de tono, sílabas separadas por espacios: "nǐ hǎo". */
  pinyin: string
}

/** Lee el JSON de un nivel (`hsk-level-1.json`). */
export function parseHskList(json: string): HskWord[] {
  const entries: unknown = JSON.parse(json)
  if (!Array.isArray(entries)) throw new Error('La lista HSK debe ser un array JSON')
  return entries.map((entry: { hanzi?: unknown; pinyin?: unknown }, index) => {
    if (typeof entry.hanzi !== 'string' || typeof entry.pinyin !== 'string') {
      throw new Error(`Lista HSK: la entrada ${index} no tiene hanzi y pinyin`)
    }
    return { hanzi: entry.hanzi, pinyin: entry.pinyin }
  })
}
