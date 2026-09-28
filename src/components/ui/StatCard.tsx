type StatCardProps = {
  label: string
  value: number | string
  /** Texto pequeño junto al valor, p. ej. "of 328". */
  detail?: string
}

/**
 * Una cifra destacada con su etiqueta. Se usa dentro de un <dl>: la etiqueta
 * es el término (<dt>) y la cifra su definición (<dd>), así los lectores de
 * pantalla leen "Day streak: 5".
 */
export function StatCard({ label, value, detail }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd className="mt-1 text-3xl font-semibold tabular-nums">
        {value}
        {detail && <span className="text-base font-normal text-ink-muted"> {detail}</span>}
      </dd>
    </div>
  )
}
