import { ButtonLink } from '../components/ui/ButtonLink.tsx'
import { PageHeader } from '../components/ui/PageHeader.tsx'
import { t } from '../i18n/index.ts'

export function NotFoundPage() {
  return (
    <>
      <PageHeader title={t('notFound.title')} description={t('notFound.description')} />
      <ButtonLink to="/" variant="secondary">
        {t('notFound.backHome')}
      </ButtonLink>
    </>
  )
}
