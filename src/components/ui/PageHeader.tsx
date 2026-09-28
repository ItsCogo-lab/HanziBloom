import type { ReactNode } from 'react'
import { t } from '../../i18n/index.ts'

type PageHeaderProps = {
  title: string
  description?: string
  /** Acciones opcionales a la derecha del título (p. ej. un botón). */
  actions?: ReactNode
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      {/* React 19 coloca este <title> en el <head>: cada página tiene su título en la pestaña */}
      <title>{`${title} · ${t('app.name')}`}</title>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-ink-muted">{description}</p>}
      </div>
      {actions}
    </header>
  )
}
