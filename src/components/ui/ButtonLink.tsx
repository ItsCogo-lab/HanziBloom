import type { ComponentProps } from 'react'
import { Link } from 'react-router'
import { buttonClasses, type ButtonVariant } from './buttonStyles.ts'

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: ButtonVariant
}

/** Navigation link that looks like a button (e.g. "Start session"). */
export function ButtonLink({ variant, className = '', ...props }: ButtonLinkProps) {
  return <Link className={`${buttonClasses(variant)} ${className}`} {...props} />
}
