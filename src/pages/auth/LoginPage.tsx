import type { FormEvent } from 'react'
import { ArrowRight, CheckCheck, LoaderCircle, Store } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Assurance from '../../components/auth/Assurance'
import AuthHeading from '../../components/auth/AuthHeading'
import AuthLayout from '../../components/auth/AuthLayout'
import PasswordField from '../../components/auth/PasswordField'
import { checkboxClass, submitClass } from '../../components/auth/formStyles'
import AuthField from '../../auth/components/AuthField'
import FormError from '../../auth/components/FormError'
import { authDestination } from '../../auth/returnTo'
import { useAuth } from '../../auth/useAuth'
import { useAuthForm } from '../../auth/useAuthForm'
import { validatePasswordLength } from '../../auth/passwordValidation'

export default function LoginPage() {
  const navigate = useNavigate()
  const { state, search } = useLocation()
  const { login } = useAuth()
  const { pending, error, fields, run } = useAuthForm()
  const passwordReset = Boolean(
    state && typeof state === 'object' && 'passwordReset' in state && state.passwordReset,
  )

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!validatePasswordLength(event.currentTarget)) return
    const data = new FormData(event.currentTarget)
    const success = await run(() =>
      login({
        email: String(data.get('email') ?? '').trim(),
        password: String(data.get('password') ?? ''),
        remember: data.get('remember') === 'on',
      }),
    )
    if (success) navigate(authDestination(state, search), { replace: true })
  }

  return (
    <AuthLayout>
      <AuthHeading
        icon={<Store size={23} strokeWidth={1.7} />}
        eyebrow="YOUR STORE, IN GOOD HANDS"
        title="Welcome back, ka-store!"
      >
        Let’s make today a good day for your business.
      </AuthHeading>
      {passwordReset && (
        <div
          role="status"
          className="mb-5 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-[11px] leading-relaxed text-green-800"
        >
          <CheckCheck size={17} className="shrink-0" />
          Your password has been reset. Sign in with your new password.
        </div>
      )}
      <form className="flex flex-col gap-[18px]" onSubmit={submit} aria-busy={pending}>
        <FormError error={error} />
        <fieldset disabled={pending} className="flex min-w-0 flex-col gap-[18px]">
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
          <PasswordField errors={fields.password} disabled={pending} />
          <div className="-mt-[3px] flex items-center justify-between gap-2.5 text-[10px] max-[700px]:text-[11px]">
            <label className="flex cursor-pointer items-center gap-[7px] text-[10px] leading-relaxed text-[#687668] max-[700px]:text-[11px]">
              <input className={checkboxClass} type="checkbox" name="remember" />
              <span>Remember me</span>
            </label>
            <Link
              className="font-semibold text-[#48694b] hover:underline"
              to="/forgot-password"
              state={state}
            >
              Forgot password?
            </Link>
          </div>
          <button className={`${submitClass} mt-[3px]`} type="submit" disabled={pending}>
            {pending ? (
              <>
                <LoaderCircle size={17} className="animate-spin" />
                Signing in…
              </>
            ) : (
              <>
                Sign in to your store
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </fieldset>
      </form>
      <Assurance>Secure account access. Your store session uses protected cookies.</Assurance>
    </AuthLayout>
  )
}
