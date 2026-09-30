type StatCardProps = {
  label: string
  value: number | string
  /** Small text next to the value, e.g. "of 328". */
  detail?: string
}

/**
 * A highlighted figure with its label. Used inside a <dl>: the label is the
 * term (<dt>) and the figure its definition (<dd>), so screen readers read
 * "Day streak: 5".
 */
export function StatCard({ label, value, detail }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-3 shadow-sm sm:p-4">
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold sm:text-3xl tabular-nums">
        {value}
        {detail && <span className="text-base font-normal text-ink-muted"> {detail}</span>}
      </dd>
    </div>
  )
}
