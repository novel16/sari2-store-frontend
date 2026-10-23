import { Bell, ChevronRight, CircleHelp, Menu, Search } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { liveStorePages, navigation } from '../../config/navigation'
import { useWorkspace } from '../../hooks/useWorkspace'

type StoreHeaderProps = {
  menuOpen: boolean
  onMenuOpen: () => void
  onSearch: () => void
  onHelp: () => void
  onNotifications: () => void
}

export default function StoreHeader({
  menuOpen,
  onMenuOpen,
  onSearch,
  onHelp,
  onNotifications,
}: StoreHeaderProps) {
  const { pathname } = useLocation()
  const current = navigation.find(
    (item) => item.path === pathname || pathname.startsWith(`${item.path}/`),
  )
  const { initials } = useWorkspace()

  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between gap-3 border-b border-[#e7e9e0] bg-white/90 px-5 backdrop-blur-lg sm:px-8 xl:px-10">
      <div className="flex min-w-0 items-center gap-3">
        <button
          className="icon-button lg:hidden"
          onClick={onMenuOpen}
          aria-label="Open navigation"
          aria-expanded={menuOpen}
        >
          <Menu size={21} />
        </button>
        <span className="hidden text-[11px] text-stone-400 sm:inline">Workspace</span>
        <ChevronRight size={12} className="hidden text-stone-300 sm:inline" />
        <span className="truncate text-xs font-semibold">{current?.label ?? 'Your store'}</span>
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-4">
        <button
          className="hidden items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-[10px] text-stone-500 transition hover:border-forest/40 sm:flex"
          onClick={onSearch}
        >
          <Search size={13} />
          <span>Find something...</span>
          <span className="ml-7 rounded border border-stone-200 px-1 text-[9px]">⌕</span>
        </button>
        <button
          className="icon-button sm:hidden"
          onClick={onSearch}
          aria-label="Search pages and products"
        >
          <Search size={18} />
        </button>
        <span className="hidden items-center gap-1.5 rounded-full bg-[#f4f1e6] px-2.5 py-1 text-[9px] font-semibold text-[#8b794a] md:flex">
          <span className="size-1.5 rounded-full bg-[#b7a160]" />
          {pathname === '/subscription' || pathname.startsWith('/subscription/')
            ? 'Plans & usage'
            : liveStorePages.includes(pathname)
              ? 'Store records'
              : 'Feature preview'}
        </span>
        <button
          className="icon-button hidden sm:flex"
          onClick={onHelp}
          aria-label="Help and getting started"
        >
          <CircleHelp size={18} />
        </button>
        <button
          className="icon-button relative"
          onClick={onNotifications}
          aria-label="View notifications"
        >
          <Bell size={18} />
        </button>
        <span className="mx-1 hidden h-6 w-px bg-stone-200 sm:block" />
        <Link
          to="/settings"
          aria-label="Your profile"
          className="avatar size-8 bg-[#e9dfd0] text-[10px] text-[#75563b]"
        >
          {initials}
        </Link>
      </div>
    </header>
  )
}
