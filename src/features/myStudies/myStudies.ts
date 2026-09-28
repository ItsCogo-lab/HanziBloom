/**
 * «My Studies»: los sets que el usuario está estudiando y cuándo estudió
 * cada set por última vez. Es el perfil local del usuario (no hay cuentas).
 *
 * Aquí NO hay progreso: el progreso de cada set se calcula con el de sus
 * elementos (studySets/setProgress.ts). Esto solo guarda qué sets ha elegido.
 */
export interface StudiedSet {
  setId: string
  /** Fecha ISO en que se añadió. */
  addedAt: string
}

export interface MyStudies {
  /** Sets añadidos, en el orden en que se añadieron. */
  sets: StudiedSet[]
  /**
   * Última sesión de cada set (fecha ISO). Incluye sets que no están en la
   * lista: también se puede estudiar un set sin añadirlo.
   */
  lastStudied: Record<string, string>
}

export function createEmptyMyStudies(): MyStudies {
  return { sets: [], lastStudied: {} }
}

export function isStudying(myStudies: MyStudies, setId: string): boolean {
  return myStudies.sets.some((set) => set.setId === setId)
}

/** Añade un set. Si ya estaba, no cambia nada (no se duplica). */
export function addSet(myStudies: MyStudies, setId: string, now: Date): MyStudies {
  if (isStudying(myStudies, setId)) return myStudies
  return { ...myStudies, sets: [...myStudies.sets, { setId, addedAt: now.toISOString() }] }
}

/** Quita un set de la lista. El progreso de sus elementos no se toca. */
export function removeSet(myStudies: MyStudies, setId: string): MyStudies {
  if (!isStudying(myStudies, setId)) return myStudies
  return { ...myStudies, sets: myStudies.sets.filter((set) => set.setId !== setId) }
}

/** Apunta que se ha empezado una sesión con este set. */
export function markSetStudied(myStudies: MyStudies, setId: string, now: Date): MyStudies {
  return { ...myStudies, lastStudied: { ...myStudies.lastStudied, [setId]: now.toISOString() } }
}

/** Los sets estudiados más recientemente, del más reciente al más antiguo. */
export function getRecentlyStudied(myStudies: MyStudies, limit = 3): { setId: string; studiedAt: string }[] {
  return Object.entries(myStudies.lastStudied)
    .map(([setId, studiedAt]) => ({ setId, studiedAt }))
    // Las fechas ISO en UTC se ordenan bien como texto
    .toSorted((a, b) => b.studiedAt.localeCompare(a.studiedAt))
    .slice(0, limit)
}
