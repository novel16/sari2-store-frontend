import type { FormEvent } from 'react'
import { useState } from 'react'
import { ArrowLeft, ArrowRight, CheckCheck, KeyRound, LoaderCircle } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Assurance from '../../components/auth/Assurance'
import AuthHeading from '../../components/auth/AuthHeading'
import AuthLayout from '../../components/auth/AuthLayout'
import PasswordField from '../../components/auth/PasswordField'
import { submitClass } from '../../components/auth/formStyles'
import AuthField from '../../auth/components/AuthField'
import FormError from '../../auth/components/FormError'
import { authApi } from '../../auth/authApi'
import {
  clearPasswordConfirmation,
  validatePasswordConfirmation,
} from '../../auth/passwordValidation'
import { useAuthForm } from '../../auth/useAuthForm'
import { useAuth } from '../../auth/useAuth'

export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { pending, error, fields, run } = useAuthForm()
  const { logout, refresh } = useAuth()
  const [resetComplete, setResetComplete] = useState(false)
  const token = params.get('token') ?? ''
  const email = params.get('email') ?? ''

  async function finishSignOut() {
    const success = await run(async () => {
      await logout()
      await refresh()
    })
    if (success) navigate('/login', { replace: true, state: { passwordReset: true } })
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token || !validatePasswordConfirmation(event.currentTarget)) return
    const data = new FormData(event.currentTarget)
    const success = await run(() =>
      authApi.resetPassword({
        token,
        email: String(data.get('email') ?? '').trim(),
        password: String(data.get('password') ?? ''),
        password_confirmation: String(data.get('password_confirmation') ?? ''),
      }),
    )
    if (success) {
      setResetComplete(true)
      await finishSignOut()
    }
  }

  return (
    <AuthLayout>
      <Link
        to="/login"
        className="mb-[30px] inline-flex items-center gap-1.5 text-[10px] text-[#687668] hover:text-forest"
      >
        <ArrowLeft size={16} />
        Back to sign in
      </Link>
      <AuthHeading
        icon={<KeyRound size={23} strokeWidth={1.7} />}
        eyebrow="A FRESH START"
        title={resetComplete ? 'Your password is reset.' : 'Choose a new password.'}
      >
        Use a unique password to keep your store account safe.
      </AuthHeading>
      {resetComplete ? (
        <div className="rounded-xl border border-[#e0e7d5] bg-[#f2f5e9] p-6 text-center">
          <span className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-[#e3ebd4] text-[#61844d]">
            <CheckCheck size={26} />
          </span>
          <p role="status" className="mb-5 text-[12px] leading-relaxed text-[#68765c]">
            Your new password is ready. We’ll sign out this browser so you can sign in with the
            right account.
          </p>
          <FormError error={error} />
          <button
            type="button"
            className={`${submitClass} mt-4`}
            disabled={pending}
            onClick={() => void finishSignOut()}
          >
            {pending ? (
              <>
                <LoaderCircle size={17} className="animate-spin" />
                Finishing securely…
              </>
            ) : (
              <>
                Continue to sign in
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </div>
      ) : !token ? (
        <div
          role="alert"
          className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-[12px] leading-relaxed text-orange-900"
        >
          This reset link is incomplete.{' '}
          <Link to="/forgot-password" className="font-semibold underline underline-offset-2">
            Request a new password reset link.
          </Link>
        </div>
      ) : (
        <form
          className="flex flex-col gap-[18px]"
          onSubmit={submit}
          onInput={(event) => clearPasswordConfirmation(event.currentTarget)}
          aria-busy={pending}
        >
          <FormError error={error} />
          <fieldset disabled={pending} className="flex min-w-0 flex-col gap-[18px]">
            <AuthField
              label="Email address"
              name="email"
              type="email"
              defaultValue={email}
              placeholder="you@example.com"
              autoComplete="email"
              errors={fields.email}
              maxLength={254}
              required
            />
            <PasswordField
              signup
              label="New password"
              errors={fields.password}
              disabled={pending}
            />
            <PasswordField
              signup
              name="password_confirmation"
              label="Confirm new password"
              showHint={false}
              errors={fields.password_confirmation}
              disabled={pending}
            />
            {fields.token?.length ? (
              <p className="text-[11px] leading-relaxed text-red-700">
                {fields.token[0]}{' '}
                <Link to="/forgot-password" className="font-semibold underline">
                  Request a new link.
                </Link>
              </p>
            ) : null}
            <button type="submit" className={submitClass} disabled={pending}>
              {pending ? (
                <>
                  <LoaderCircle size={17} className="animate-spin" />
                  Resetting password…
                </>
              ) : (
                <>
                  Reset password
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </fieldset>
        </form>
      )}
      <Assurance>Sign in with your new password after a successful reset.</Assurance>
    </AuthLayout>
  )
}
