import { ProgressBar } from '../../../components/ui/ProgressBar.tsx'
import { formatPercent, t } from '../../../i18n/index.ts'
import type { SetProgress } from '../setProgress.ts'

type SetProgressBarProps = {
  name: string
  progress: SetProgress
}

/** Progress bar of a set with its text: "12% · 40 of 328 learned". */
export function SetProgressBar({ name, progress }: SetProgressBarProps) {
  const text = t('sets.progress', { mastered: progress.mastered, total: progress.total })
  return (
    <div className="flex flex-col gap-1.5">
      <ProgressBar value={progress.mastered} max={progress.total} label={`${name}: ${text}`} />
      <p className="text-sm text-ink-muted">
        {formatPercent(progress.ratio)} · {text}
      </p>
    </div>
  )
}
