export type ButtonVariant = 'primary' | 'secondary' | 'danger'

const baseClasses =
  'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-base font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50'

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-on-accent hover:bg-accent-strong',
  secondary: 'border border-line bg-surface text-ink hover:bg-paper',
  danger: 'bg-danger text-on-accent hover:bg-danger/85',
}

/**
 * Tailwind classes for a button. They live apart from the component so that
 * <Button> and <ButtonLink> (a link that looks like a button) look the same.
 */
export function buttonClasses(variant: ButtonVariant = 'primary'): string {
  return `${baseClasses} ${variantClasses[variant]}`
}
