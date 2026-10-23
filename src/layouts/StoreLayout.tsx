import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import StoreHeader from '../components/layout/StoreHeader'
import SearchDialog from '../components/layout/SearchDialog'
import HelpDialog from '../components/layout/HelpDialog'
import NotificationsDialog from '../components/layout/NotificationsDialog'
import { DemoNote } from '../components/ui'
import { useMobileDrawer } from '../hooks/useMobileDrawer'
import { liveStorePages } from '../config/navigation'

export default function StoreLayout() {
  const { isOpen, setIsOpen, drawerRef } = useMobileDrawer()
  const [dialog, setDialog] = useState<'search' | 'notifications' | 'help' | null>(null)
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="min-h-screen bg-paper text-ink">
      {isOpen && (
        <button
          className="fixed inset-0 z-40 bg-ink/35 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
          aria-label="Close navigation overlay"
          tabIndex={-1}
        />
      )}
      <aside
        ref={drawerRef}
        role={isOpen ? 'dialog' : undefined}
        aria-modal={isOpen || undefined}
        className={`fixed inset-y-0 left-0 z-50 flex w-[236px] flex-col border-r border-[#e7e9e0] bg-[#f8f9f5] transition-transform duration-200 lg:visible lg:translate-x-0 ${isOpen ? 'visible translate-x-0' : 'invisible -translate-x-full'}`}
        aria-label="Store sidebar"
      >
        <Sidebar close={() => setIsOpen(false)} />
      </aside>
      <div className="lg:ml-[236px]">
        <StoreHeader
          menuOpen={isOpen}
          onMenuOpen={() => setIsOpen(true)}
          onSearch={() => setDialog('search')}
          onHelp={() => setDialog('help')}
          onNotifications={() => setDialog('notifications')}
        />
        <main className="mx-auto max-w-[1640px] px-5 pb-8 pt-7 sm:px-8 xl:px-10">
          <Outlet />
        </main>
        <footer className="mx-5 flex flex-wrap items-center justify-between gap-2 border-t border-stone-200/70 py-5 text-[10px] text-stone-500 sm:mx-8 xl:mx-10">
          <span>Made for the heart of your neighborhood.</span>
          <DemoNote>
            {pathname === '/subscription' || pathname.startsWith('/subscription/')
              ? 'Plans & usage · Current store allowance'
              : liveStorePages.includes(pathname)
                ? 'Your store records · Saved to your store'
                : 'Feature preview · Sample data'}
          </DemoNote>
        </footer>
      </div>
      {dialog === 'search' && <SearchDialog onClose={() => setDialog(null)} />}
      {dialog === 'notifications' && <NotificationsDialog onClose={() => setDialog(null)} />}
      {dialog === 'help' && <HelpDialog onClose={() => setDialog(null)} />}
    </div>
  )
}
