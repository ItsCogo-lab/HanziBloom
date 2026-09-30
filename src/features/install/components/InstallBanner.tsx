import { useId } from 'react'
import { useLocation } from 'react-router'
import { Button } from '../../../components/ui/Button.tsx'
import { t } from '../../../i18n/index.ts'
import { useInstallPrompt } from '../useInstallPrompt.ts'
import { IosInstallSteps } from './IosInstallSteps.tsx'

/**
 * Prompt to add the app to the home screen. It appears above the navigation
 * bar, blocks nothing and, once dismissed, doesn't come back (Settings still
 * offers installation). It doesn't appear during a session, so it won't cover
 * the buttons, nor in Settings, which already has its own install section.
 */
export function InstallBanner() {
  const titleId = useId()
  const { pathname } = useLocation()
  const { mode, dismissed, install, dismiss } = useInstallPrompt()

  const hidden = pathname.startsWith('/study/practice') || pathname === '/settings'
  if (!mode || dismissed || hidden) return null

  return (
    <aside
      aria-labelledby={titleId}
      className="fixed inset-x-3 bottom-[calc(var(--mobile-nav-height)+0.75rem)] z-20 flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 shadow-lg md:inset-x-auto md:right-6 md:bottom-6 md:w-96"
    >
      <div className="flex items-start gap-3">
        <img src={`${import.meta.env.BASE_URL}icons/icon-192.png`} alt="" className="size-11 shrink-0 rounded-xl" />
        <div>
          <h2 id={titleId} className="font-semibold">
            {t('install.title')}
          </h2>
          <p className="text-sm text-ink-muted">{t('install.description')}</p>
        </div>
      </div>
      {mode === 'ios' && <IosInstallSteps />}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" className="px-4 py-2 text-sm" onClick={dismiss}>
          {t(mode === 'ios' ? 'install.gotIt' : 'install.notNow')}
        </Button>
        {mode === 'native' && (
          <Button className="px-4 py-2 text-sm" onClick={() => void install()}>
            {t('install.install')}
          </Button>
        )}
      </div>
    </aside>
  )
}
