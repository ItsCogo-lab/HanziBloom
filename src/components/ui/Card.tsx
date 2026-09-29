import type { ComponentProps } from 'react'

export function Card({ className = '', ...props }: ComponentProps<'section'>) {
  return (
    <section
      className={`rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-6 ${className}`}
      {...props}
    />
  )
}
