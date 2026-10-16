import type { FormEvent } from 'react'
import { ArrowRight, Check, LoaderCircle, Sparkles } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import Assurance from '../../components/auth/Assurance'
import AuthHeading from '../../components/auth/AuthHeading'
import AuthLayout from '../../components/auth/AuthLayout'
import PasswordField from '../../components/auth/PasswordField'
import { submitClass } from '../../components/auth/formStyles'
import AuthField from '../../auth/components/AuthField'
import FormError from '../../auth/components/FormError'
import {
  clearPasswordConfirmation,
  validatePasswordConfirmation,
} from '../../auth/passwordValidation'
import { returnToFromState } from '../../auth/returnTo'
import { useAuth } from '../../auth/useAuth'
import { useAuthForm } from '../../auth/useAuthForm'

export default function SignupPage() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { register } = useAuth()
  const { pending, error, fields, run } = useAuthForm()

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!validatePasswordConfirmation(event.currentTarget)) return
    const data = new FormData(event.currentTarget)
    const success = await run(() =>
      register({
        name: String(data.get('name') ?? '').trim(),
        store_name: String(data.get('store_name') ?? '').trim(),
        email: String(data.get('email') ?? '').trim(),
        password: String(data.get('password') ?? ''),
        password_confirmation: String(data.get('password_confirmation') ?? ''),
      }),
    )
    if (success) navigate(returnToFromState(state), { replace: true })
  }

  return (
    <AuthLayout signup>
      <AuthHeading
        icon={<Sparkles size={23} strokeWidth={1.7} />}
        eyebrow="A FRESH START FOR YOUR STORE"
        title="Small store. Big dreams."
      >
        Create your owner account and make room for a simpler everyday.
      </AuthHeading>
      <form
        className="flex flex-col gap-[15px]"
        onSubmit={submit}
        onInput={(event) => clearPasswordConfirmation(event.currentTarget)}
        aria-busy={pending}
      >
        <FormError error={error} />
        <fieldset disabled={pending} className="flex min-w-0 flex-col gap-[15px]">
          <AuthField
            label="Your full name"
            name="name"
            placeholder="e.g. Juan dela Cruz"
            autoComplete="name"
            errors={fields.name}
            maxLength={120}
            required
          />
          <AuthField
            label="Store name"
            name="store_name"
            placeholder="e.g. Aling Nena’s Store"
            autoComplete="organization"
            errors={fields.store_name}
            maxLength={120}
            required
          />
          <AuthField
            label="Email address"
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            errors={fields.email}
            maxLength={254}
            required
          />
          <PasswordField signup errors={fields.password} disabled={pending} />
          <PasswordField
            signup
            name="password_confirmation"
            label="Confirm password"
            showHint={false}
            errors={fields.password_confirmation}
            disabled={pending}
          />
          <button type="submit" className={`${submitClass} mt-[3px]`} disabled={pending}>
            {pending ? (
              <>
                <LoaderCircle size={17} className="animate-spin" />
                Creating your store…
              </>
            ) : (
              <>
                Create your store
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </fieldset>
      </form>
      <p className="mt-[13px] flex items-center justify-center gap-[5px] text-[9px] text-[#657955] max-[700px]:text-[10px]">
        <Check size={14} />A fresh start. No credit card needed.
      </p>
      <Assurance>Your account and store will be created securely.</Assurance>
    </AuthLayout>
  )
}
