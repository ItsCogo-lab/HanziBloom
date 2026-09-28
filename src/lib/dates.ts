/**
 * Utilidades de fechas en la hora local del usuario.
 *
 * Los repasos y la racha van por días del calendario local: si alguien
 * estudia a las 23:30 y a las 00:15, son dos días distintos para él, aunque
 * en UTC fueran el mismo.
 */

/** Clave del día local, p. ej. "2026-09-28". Se puede ordenar como texto. */
export type DateKey = string

export function toDateKey(date: Date): DateKey {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/** Fecha a las 00:00 (hora local) del día de `date`. */
export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/**
 * Suma días del calendario. Se usa setDate y no «+ 24 h» porque en los
 * cambios de hora un día puede durar 23 o 25 horas.
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}
