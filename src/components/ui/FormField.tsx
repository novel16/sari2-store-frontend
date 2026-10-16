import type { ReactNode } from 'react'

export function FormField({
  label,
  name,
  errors,
  children,
  wide = false,
}: {
  label: string
  name: string
  errors?: string[]
  children: ReactNode
  wide?: boolean
}) {
  return (
    <div className={`field${wide ? ' sm:col-span-2' : ''}`}>
      <label htmlFor={name}>{label}</label>
      {children}
      {errors?.[0] && (
        <p id={`${name}-error`} className="text-[11px] text-red-700">
          {errors[0]}
        </p>
      )}
    </div>
  )
}
