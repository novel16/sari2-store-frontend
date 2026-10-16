import { useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowLeft, ArrowRight, CheckCheck, LoaderCircle, Mail } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import Assurance from '../../components/auth/Assurance'
import AuthHeading from '../../components/auth/AuthHeading'
import AuthLayout from '../../components/auth/AuthLayout'
import { submitClass } from '../../components/auth/formStyles'
import AuthField from '../../auth/components/AuthField'
import FormError from '../../auth/components/FormError'
import { authApi } from '../../auth/authApi'
import { useAuthForm } from '../../auth/useAuthForm'

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false)
  const { state } = useLocation()
  const { pending, error, fields, run } = useAuthForm()

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const success = await run(() => authApi.forgotPassword(String(data.get('email') ?? '').trim()))
    if (success) setSubmitted(true)
  }

  return (
    <AuthLayout>
      <Link
        to="/login"
        state={state}
        className="mb-[30px] inline-flex items-center gap-1.5 text-[10px] text-[#687668] hover:text-forest"
      >
        <ArrowLeft size={16} />
        Back to sign in
      </Link>
      <AuthHeading
        icon={<Mail size={23} strokeWidth={1.7} />}
        eyebrow="WE’VE GOT YOU"
        title={submitted ? 'Check your inbox.' : 'A little help signing in.'}
      >
        {submitted
          ? 'The next step is on its way, if your email is registered.'
          : 'Enter your email and we’ll help you reset your password.'}
      </AuthHeading>
      {submitted ? (
        <div
          className="rounded-xl border border-[#e0e7d5] bg-[#f2f5e9] p-6 text-center"
          role="status"
        >
          <span className="mx-auto mb-[15px] grid size-12 place-items-center rounded-full bg-[#e3ebd4] text-[#61844d]">
            <CheckCheck size={26} />
          </span>
          <h2 className="mb-[9px] font-display text-[16px] font-semibold tracking-[-.4px] text-[#31513e]">
            Check your email for a reset link
          </h2>
          <p className="mb-5 text-[11px] leading-[1.8] text-[#68765c]">
            If an account matches that email address, you’ll receive a password reset link. Check
            your spam folder too.
          </p>
          <Link to="/login" state={state} className={submitClass}>
            Back to sign in
            <ArrowRight size={17} />
          </Link>
          <button
            type="button"
            className="mt-[18px] cursor-pointer border-0 bg-transparent text-[10px] text-[#6c8058] underline underline-offset-4"
            onClick={() => setSubmitted(false)}
          >
            Try a different email
          </button>
        </div>
      ) : (
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
            <button type="submit" className={submitClass} disabled={pending}>
              {pending ? (
                <>
                  <LoaderCircle size={17} className="animate-spin" />
                  Sending reset link…
                </>
              ) : (
                <>
                  Send reset link
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </fieldset>
        </form>
      )}
      <Assurance>Reset links are private and expire for your security.</Assurance>
    </AuthLayout>
  )
}
