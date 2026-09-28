import { ComingSoon } from '../components/ComingSoon.tsx'
import { PageHeader } from '../components/ui/PageHeader.tsx'
import { t } from '../i18n/index.ts'

export function SettingsPage() {
  return (
    <>
      <PageHeader title={t('nav.settings')} description={t('settings.description')} />
      <ComingSoon />
    </>
  )
}
