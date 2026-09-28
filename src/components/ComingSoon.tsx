import { t } from '../i18n/index.ts'
import { Card } from './ui/Card.tsx'

/** Contenido provisional de las secciones que aún no están construidas. */
export function ComingSoon() {
  return (
    <Card>
      <p className="text-ink-muted">{t('common.comingSoon')}</p>
    </Card>
  )
}
