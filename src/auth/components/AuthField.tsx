import type { InputHTMLAttributes } from 'react'
import { inputClass, labelClass } from '../../components/auth/formStyles'

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  errors?: string[]
  name: string
}

export default function AuthField({ label, errors, name, id = name, ...props }: AuthFieldProps) {
  const errorId = `${id}-error`
  return (
    <div className={labelClass}>
      <label htmlFor={id}>{label}</label>
      <input
        {...props}
        id={id}
        name={name}
        className={inputClass}
        aria-invalid={Boolean(errors?.length)}
        aria-describedby={errors?.length ? errorId : undefined}
      />
      {errors?.length ? (
        <p id={errorId} className="text-[11px] font-normal leading-relaxed text-red-700">
          {errors[0]}
        </p>
      ) : null}
    </div>
  )
}
