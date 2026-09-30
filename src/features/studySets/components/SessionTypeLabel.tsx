import { t } from '../../../i18n/index.ts'
import type { SetSessionType } from '../sessionItems.ts'

/** Icon and texts for each session type: they are not told apart by color alone. */
const SESSION_TYPES = {
  learn: { icon: '新', nameKey: 'session.learn', descriptionKey: 'session.learnDescription' },
  study: { icon: '复', nameKey: 'session.study', descriptionKey: 'session.studyDescription' },
} as const

/** "新 Learn · Learn new vocabulary" or "复 Study · Review vocabulary you've already learned". */
export function SessionTypeLabel({ type, as: Heading = 'p' }: { type: SetSessionType; as?: 'p' | 'h2' | 'h3' }) {
  const { icon, nameKey, descriptionKey } = SESSION_TYPES[type]
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft font-hanzi text-xl text-accent-strong"
      >
        {icon}
      </span>
      <div>
        <Heading className="font-semibold">{t(nameKey)}</Heading>
        <p className="text-sm text-ink-muted">{t(descriptionKey)}</p>
      </div>
    </div>
  )
}
