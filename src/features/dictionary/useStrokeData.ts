import { loadStrokes } from './runtime/dictionaryService.ts'
import { useRuntimeData } from './runtime/runtimeSourcesContext.ts'
import type { StrokeData } from './strokeData.ts'

/**
 * A character's strokes through the dictionary service: jsDelivr, with the
 * local copy of HSK 1-4 (`hasLocalCopy`) as fallback.
 */
export function useStrokeData(hanzi: string, hasLocalCopy: boolean) {
  return useRuntimeData<StrokeData>(`${hanzi}|${hasLocalCopy}`, (sources, options) =>
    loadStrokes(sources, hanzi, hasLocalCopy, options),
  )
}
