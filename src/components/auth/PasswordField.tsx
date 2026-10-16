import { useId, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { inputClass, labelClass } from './formStyles'

type PasswordFieldProps = {
  signup?: boolean
  name?: string
  label?: string
  errors?: string[]
  disabled?: boolean
  showHint?: boolean
  onInput?: () => void
}

export default function PasswordField({
  signup = false,
  name = 'password',
  label = 'Password',
  errors,
  disabled = false,
  showHint = signup,
  onInput,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)
  const passwordId = useId()
  const errorId = `${passwordId}-error`
  const hintId = `${passwordId}-hint`

  return (
    <div className={labelClass}>
      <label htmlFor={passwordId}>{label}</label>
      <div className="relative">
        <input
          id={passwordId}
          className={`${inputClass} !pr-11`}
          name={name}
          type={visible ? 'text' : 'password'}
          placeholder={
            name === 'password_confirmation'
              ? 'Enter your password again'
              : signup
                ? 'Create a password'
                : 'Enter your password'
          }
          autoComplete={signup ? 'new-password' : 'current-password'}
          minLength={signup ? 8 : 1}
          maxLength={72}
          aria-invalid={Boolean(errors?.length)}
          aria-describedby={
            [errors?.length ? errorId : '', showHint ? hintId : ''].filter(Boolean).join(' ') ||
            undefined
          }
          disabled={disabled}
          onInput={(event) => {
            event.currentTarget.setCustomValidity('')
            onInput?.()
          }}
          required
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 grid w-11 cursor-pointer place-items-center rounded-[7px] border-0 bg-transparent text-[#738171] hover:text-forest disabled:cursor-not-allowed"
          onClick={() => setVisible(!visible)}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
          aria-controls={passwordId}
          disabled={disabled}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {showHint && (
        <span id={hintId} className="-mt-px text-[10px] font-normal text-[#6c7b60]">
          Use 8–72 characters. Emoji and accented letters may require a shorter password.
        </span>
      )}
      {errors?.length ? (
        <p id={errorId} className="text-[11px] font-normal leading-relaxed text-red-700">
          {errors[0]}
        </p>
      ) : null}
    </div>
  )
}
