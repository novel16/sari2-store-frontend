import { RefreshCw, WifiOff } from 'lucide-react'
import { Brand } from '../../components/ui'
import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../useAuth'
import { useAuthForm } from '../useAuthForm'
import FormError from './FormError'

export default function SessionError() {
  const { error, refresh, logout } = useAuth()
  const { pending, error: logoutError, run } = useAuthForm()
  const navigate = useNavigate()
  const unavailable = error?.status === 403

  async function signOut() {
    if (await run(logout)) navigate('/login', { replace: true })
  }
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-paper px-6 py-12">
      <Brand />
      <section
        className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm"
        role="alert"
      >
        <span className="mx-auto mb-5 grid size-12 place-items-center rounded-full bg-orange-50 text-orange-700">
          <WifiOff size={24} />
        </span>
        <h1 className="mb-3 font-display text-xl font-bold text-ink">
          {unavailable ? 'Your workspace is unavailable.' : 'Let’s reconnect to your store.'}
        </h1>
        <p className="mb-6 text-sm leading-relaxed text-stone-600">
          {error?.message ?? 'We couldn’t check your session. Please try again.'}
        </p>
        <button type="button" className="btn btn-primary w-full" onClick={() => void refresh()}>
          <RefreshCw size={16} />
          Try again
        </button>
        {unavailable && (
          <>
            <FormError error={logoutError} />
            <button
              type="button"
              disabled={pending}
              className="btn btn-secondary mt-3 w-full"
              onClick={() => void signOut()}
            >
              <LogOut size={16} />
              {pending ? 'Signing out…' : 'Sign out and switch accounts'}
            </button>
          </>
        )}
      </section>
    </main>
  )
}
