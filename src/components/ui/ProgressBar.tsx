type ProgressBarProps = {
  value: number
  max: number
  /** Text for screen readers, e.g. "Session progress". */
  label: string
}

export function ProgressBar({ value, max, label }: ProgressBarProps) {
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className="h-2 overflow-hidden rounded-full bg-line"
    >
      <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${percentage}%` }} />
    </div>
  )
}
