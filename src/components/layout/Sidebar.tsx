import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { ArrowUpRight, ChevronDown, LogOut, Sparkles, Store, X } from 'lucide-react'
import { Brand } from '../ui'
import { navigation } from '../../config/navigation'
import { useAuth } from '../../auth/useAuth'
import { useWorkspace } from '../../hooks/useWorkspace'

export default function Sidebar({ close }: { close: () => void }) {
  const { logout } = useAuth()
  const { user, account, store, initials } = useWorkspace()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)
  const [logoutError, setLogoutError] = useState('')

  async function signOut() {
    setSigningOut(true)
    setLogoutError('')
    try {
      await logout()
      close()
      navigate('/login', { replace: true })
    } catch {
      setLogoutError('Unable to sign out. Check your connection and try again.')
    } finally {
      setSigningOut(false)
    }
  }
  return (
    <>
      <div className="flex h-24 shrink-0 items-center justify-between px-6">
        <Link to="/dashboard" onClick={close} aria-label="Sarisari home">
          <Brand />
        </Link>
        <button className="icon-button lg:hidden" onClick={close} aria-label="Close navigation">
          <X size={19} />
        </button>
      </div>
      <Link
        to="/settings"
        onClick={close}
        className="mx-4 mb-7 flex items-center gap-3 rounded-xl border border-stone-200/80 bg-white p-3 transition hover:border-forest/40"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#edf0df] text-forest">
          <Store size={20} />
        </span>
        <span className="min-w-0 flex-1">
          <strong className="block break-words text-[11px] font-bold leading-snug">
            {store?.name ?? 'Your store'}
          </strong>
          <span className="mt-1 block text-[10px] leading-snug text-stone-500">
            Your store workspace
          </span>
        </span>
        <ChevronDown size={13} className="text-stone-400" />
      </Link>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5">
        <div className="mb-2 px-3 text-[9px] font-bold tracking-[.17em] text-stone-400">
          YOUR WORKSPACE
        </div>
        <nav aria-label="Main navigation" className="space-y-1">
          {navigation.map((item, index) => (
            <div key={item.path}>
              {index === 7 && (
                <div className="mb-2 mt-7 px-3 text-[9px] font-bold tracking-[.17em] text-stone-400">
                  YOUR BUSINESS
                </div>
              )}
              <NavLink
                to={item.path}
                onClick={close}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[12px] font-medium transition ${isActive ? 'bg-forest text-white shadow-sm shadow-forest/10' : 'text-[#72796f] hover:bg-[#eaece3] hover:text-forest'}`
                }
              >
                <item.icon size={17} strokeWidth={1.7} />
                <span className="flex-1">{item.label}</span>
                {item.count && (
                  <span className="rounded-md bg-[#f8ead8] px-1.5 py-0.5 text-[9px] font-bold text-[#a27630]">
                    {item.count}
                  </span>
                )}
                {item.path === '/pos' && (
                  <span className="rounded border border-current/20 px-1 py-0.5 text-[8px] opacity-60">
                    POS
                  </span>
                )}
              </NavLink>
            </div>
          ))}
        </nav>
      </div>
      <div className="mx-4 mb-4 rounded-xl border border-[#e5e8db] bg-[#edf0e5] p-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-bold text-forest">
          <Sparkles size={14} />A little room to grow
        </div>
        <p className="mb-3 text-[10px] leading-relaxed text-stone-500">
          More products, more possibilities.
          <br />
          Find the plan for your store.
        </p>
        <Link
          to="/subscription"
          onClick={close}
          className="flex items-center justify-between text-[11px] font-bold text-forest"
        >
          Explore plans <ArrowUpRight size={14} />
        </Link>
      </div>
      <div className="flex items-center gap-3 border-t border-stone-200/70 px-5 py-4">
        <span className="avatar bg-[#e5d8c6] text-[#75563b]">{initials}</span>
        <Link to="/settings" onClick={close} className="min-w-0 flex-1">
          <strong className="block break-words text-[11px]">{user?.name}</strong>
          <span className="text-[10px] text-stone-500">
            Store owner <span className="mx-1 text-stone-300">·</span>{' '}
            {account?.subscription?.plan.name ?? 'Free'} plan
          </span>
        </Link>
        <button
          type="button"
          disabled={signingOut}
          onClick={() => void signOut()}
          className="text-stone-400 transition hover:text-forest"
          aria-label={signingOut ? 'Signing out' : 'Sign out'}
        >
          <LogOut size={16} />
        </button>
      </div>
      {logoutError && (
        <p role="alert" className="px-5 pb-4 text-[11px] text-red-700">
          {logoutError}
        </p>
      )}
    </>
  )
}
