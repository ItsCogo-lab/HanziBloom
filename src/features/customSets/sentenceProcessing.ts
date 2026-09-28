import { splitSentence } from './sentences.ts'
import type { SentenceToken } from './types.ts'

/**
 * Procesa una frase del usuario (ya validada) y devuelve sus trozos, que se
 * guardan con la frase. Es asíncrona para poder cargar bajo demanda lo que
 * haga falta sin que pese en la carga inicial de la app.
 */
export async function processSentence(chinese: string): Promise<SentenceToken[]> {
  return splitSentence(chinese)
}
