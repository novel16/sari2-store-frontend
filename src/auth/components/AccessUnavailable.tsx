import { LoaderCircle, LogOut, ShieldAlert } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Brand } from '../../components/ui'
import { useAuth } from '../useAuth'
import { useAuthForm } from '../useAuthForm'
import FormError from './FormError'

export default function AccessUnavailable() {
  const { user, logout } = useAuth()
  const { pending, error, run } = useAuthForm()
  const navigate = useNavigate()

  async function signOut() {
    if (await run(logout)) navigate('/login', { replace: true })
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-paper px-6 py-12">
      <Brand />
      <section className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
        <span className="mx-auto mb-5 grid size-12 place-items-center rounded-full bg-orange-50 text-orange-700">
          <ShieldAlert size={24} />
        </span>
        <h1 className="mb-3 font-display text-xl font-bold text-ink">
          This account can’t open a store workspace.
        </h1>
        <p className="mb-3 text-sm leading-relaxed text-stone-600">
          {user?.platform_role === 'platform_admin'
            ? 'You’re signed in with a platform administrator account. Use your store owner account to open the client workspace.'
            : 'An active owner account and an active store are needed to continue. Contact your administrator if your store should be available.'}
        </p>
        <p className="mb-5 break-words text-xs text-stone-500">Signed in as {user?.email}</p>
        <FormError error={error} />
        <button
          type="button"
          disabled={pending}
          className="btn btn-primary mt-4 w-full"
          onClick={() => void signOut()}
        >
          {pending ? (
            <>
              <LoaderCircle size={16} className="animate-spin" />
              Signing out…
            </>
          ) : (
            <>
              <LogOut size={16} />
              Sign out and switch accounts
            </>
          )}
        </button>
      </section>
    </main>
  )
}
