import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { t } from '../i18n/index.ts'
import { AppRoutes } from './AppRoutes.tsx'
import { NAVIGATION_ITEMS } from './navigation.ts'

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  )
}

function getMainNavigation() {
  return screen.getByRole('navigation', { name: 'Navegación principal' })
}

describe('AppRoutes', () => {
  it.each(NAVIGATION_ITEMS)('la ruta $path muestra su página', ({ path, labelKey }) => {
    renderAt(path)

    expect(screen.getByRole('heading', { level: 1, name: t(labelKey) })).toBeInTheDocument()
  })

  it('navega a otra sección al pulsar un enlace y lo marca como actual', async () => {
    const user = userEvent.setup()
    renderAt('/')

    await user.click(within(getMainNavigation()).getByRole('link', { name: 'Práctica' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Práctica' })).toBeInTheDocument()
    expect(within(getMainNavigation()).getByRole('link', { name: 'Práctica' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(within(getMainNavigation()).getByRole('link', { name: 'Inicio' })).not.toHaveAttribute(
      'aria-current',
    )
  })

  it('el botón «Empezar sesión» del inicio lleva a la práctica', async () => {
    const user = userEvent.setup()
    renderAt('/')

    await user.click(screen.getByRole('link', { name: 'Empezar sesión' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Práctica' })).toBeInTheDocument()
  })

  it('muestra una página de error en rutas desconocidas', () => {
    renderAt('/no-existe')

    expect(screen.getByRole('heading', { level: 1, name: 'Página no encontrada' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute('href', '/')
  })
})
