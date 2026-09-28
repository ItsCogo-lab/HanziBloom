import { t, type MessageKey } from '../../../i18n/index.ts'
import type { ItemStatus } from '../progress.ts'

const STATUS_STYLES: Record<ItemStatus, { labelKey: MessageKey; className: string }> = {
  new: { labelKey: 'status.new', className: 'border-line text-ink-muted' },
  learning: { labelKey: 'status.learning', className: 'border-accent/40 bg-accent-soft text-accent-strong' },
  mastered: { labelKey: 'status.mastered', className: 'border-success/40 bg-success/10 text-success' },
}

/** Etiqueta con el estado de un elemento: nuevo, aprendiendo o dominado. */
export function StatusBadge({ status }: { status: ItemStatus }) {
  const { labelKey, className } = STATUS_STYLES[status]
  return (
    <span className={`inline-block shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {t(labelKey)}
    </span>
  )
}
