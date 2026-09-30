import { Button } from '../../../components/ui/Button.tsx'
import { t } from '../../../i18n/index.ts'
import { isStandalone } from '../install.ts'
import { useInstallPrompt } from '../useInstallPrompt.ts'
import { IosInstallSteps } from './IosInstallSteps.tsx'

/** Settings section: install the app even if the banner was dismissed. */
export function InstallSetting() {
  const { mode, install } = useInstallPrompt()

  if (isStandalone()) return <p>{t('install.installed')}</p>

  return (
    <div className="flex flex-col gap-4">
      <p className="text-ink-muted">{t('install.description')}</p>
      {mode === 'native' && (
        <Button className="self-start" onClick={() => void install()}>
          {t('install.install')}
        </Button>
      )}
      {mode === 'ios' && <IosInstallSteps />}
      {!mode && <p className="text-sm text-ink-muted">{t('install.unavailable')}</p>}
    </div>
  )
}
