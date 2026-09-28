import { ComingSoon } from '../components/ComingSoon.tsx'
import { ButtonLink } from '../components/ui/ButtonLink.tsx'
import { PageHeader } from '../components/ui/PageHeader.tsx'
import { t } from '../i18n/index.ts'

export function DashboardPage() {
  return (
    <>
      <PageHeader
        title={t('nav.dashboard')}
        description={t('dashboard.description')}
        actions={<ButtonLink to="/practice">{t('dashboard.startSession')}</ButtonLink>}
      />
      <ComingSoon />
    </>
  )
}
