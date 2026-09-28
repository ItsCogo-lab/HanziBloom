import type { ComponentProps } from 'react'
import { Link } from 'react-router'
import { buttonClasses, type ButtonVariant } from './buttonStyles.ts'

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: ButtonVariant
}

/** Enlace de navegación con aspecto de botón (p. ej. «Empezar sesión»). */
export function ButtonLink({ variant, className = '', ...props }: ButtonLinkProps) {
  return <Link className={`${buttonClasses(variant)} ${className}`} {...props} />
}
