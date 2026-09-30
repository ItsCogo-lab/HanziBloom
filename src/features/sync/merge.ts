/**
 * Cómo se juntan los datos de dos dispositivos cuando los dos han cambiado
 * desde la última sincronización. Son funciones puras: no leen ni guardan.
 *
 * La regla general es no perder nada: de cada elemento se queda la versión
 * más reciente y lo que solo está en un lado se conserva.
 */
import type { CustomSet } from '../customSets/types.ts'
import type { MyStudies } from '../myStudies/myStudies.ts'
import type { DailyActivity, ItemProgress, ProgressData } from '../progress/types.ts'

export function mergeProgress(local: ProgressData, remote: ProgressData): ProgressData {
  const items: ProgressData['items'] = { ...remote.items }
  for (const [id, item] of Object.entries(local.items) as [keyof ProgressData['items'], ItemProgress][]) {
    const other = items[id]
    items[id] = other && isNewer(other, item) ? other : item
  }

  // No se pueden sumar: si un día se sincronizó a medias, las respuestas
  // saldrían dos veces. Se queda el registro con más respuestas.
  const activity: Record<string, DailyActivity> = { ...remote.activity }
  for (const [day, value] of Object.entries(local.activity)) {
    const other = activity[day]
    if (!other || value.answers >= other.answers) activity[day] = value
  }
  return { items, activity }
}

/** `a` es más reciente que `b`: se repasó después o, si empatan, se ha visto más veces. */
function isNewer(a: ItemProgress, b: ItemProgress): boolean {
  if (a.lastReviewedAt !== b.lastReviewedAt) return a.lastReviewedAt > b.lastReviewedAt
  return a.timesSeen > b.timesSeen
}

export function mergeMyStudies(local: MyStudies, remote: MyStudies): MyStudies {
  const sets = [...local.sets]
  for (const set of remote.sets) {
    const index = sets.findIndex((other) => other.setId === set.setId)
    if (index === -1) sets.push(set)
    else if (set.addedAt < sets[index]!.addedAt) sets[index] = set
  }

  const lastStudied = { ...remote.lastStudied }
  for (const [setId, date] of Object.entries(local.lastStudied)) {
    const other = lastStudied[setId]
    if (!other || date > other) lastStudied[setId] = date
  }
  return { sets, lastStudied }
}

export function mergeCustomSets(local: readonly CustomSet[], remote: readonly CustomSet[]): CustomSet[] {
  const sets = [...local]
  for (const set of remote) {
    const index = sets.findIndex((other) => other.id === set.id)
    if (index === -1) sets.push(set)
    else if (set.updatedAt > sets[index]!.updatedAt) sets[index] = set
  }
  return sets
}
