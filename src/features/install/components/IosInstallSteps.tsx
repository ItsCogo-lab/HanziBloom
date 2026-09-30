import { t } from '../../../i18n/index.ts'

/** The two Safari steps, with the same icons the person sees on the iPhone. */
export function IosInstallSteps() {
  return (
    <ol className="flex flex-col gap-2 text-sm">
      <li className="flex items-center gap-2">
        <ShareIcon />
        <span>{t('install.iosStepShare')}</span>
      </li>
      <li className="flex items-center gap-2">
        <AddIcon />
        <span>{t('install.iosStepAdd')}</span>
      </li>
    </ol>
  )
}

const iconClasses = 'size-7 shrink-0 rounded-lg bg-paper p-1 text-accent-strong'

/** Safari's "Share" icon: a square with an upward arrow. */
function ShareIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClasses}>
      <path d="M12 15V3m0 0L8 7m4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 10H6a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1h-2" strokeLinecap="round" />
    </svg>
  )
}

/** "Add to Home Screen" icon: a square with a +. */
function AddIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClasses}>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M12 8v8m-4-4h8" strokeLinecap="round" />
    </svg>
  )
}
