import type { ReactNode } from 'react'
import { ArrowUpRight, Menu, Store } from 'lucide-react'
import type { SiteContent } from '../website/types'

export default function PublicLayout({
  content,
  children,
  preview = false,
}: {
  content: SiteContent
  children: ReactNode
  preview?: boolean
}) {
  return (
    <div className="public-site min-h-dvh bg-[#fbfcf8] text-ink">
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:p-4"
        href="#main-content"
      >
        Skip to content
      </a>
      {preview && (
        <div className="bg-amber-100 px-5 py-3 text-center text-sm text-amber-950">
          Saved draft preview · Changes become public only after publishing.
        </div>
      )}
      <header className="sticky top-0 z-30 border-b border-forest/10 bg-[#fbfcf8]/95 backdrop-blur-lg">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-5 px-5 sm:px-8">
          <a href="/" className="flex items-center gap-3" aria-label={`${content.brand.name} home`}>
            {content.media.logo_url ? (
              <img
                src={content.media.logo_url}
                alt=""
                width="44"
                height="44"
                className="size-11 rounded-xl object-contain"
              />
            ) : (
              <span className="grid size-11 place-items-center rounded-2xl bg-forest text-[#edf0d7]">
                <Store size={25} strokeWidth={1.7} />
              </span>
            )}
            <span>
              <strong className="block font-display text-2xl font-extrabold tracking-tight">
                {content.brand.name}
                <span className="text-[#c48a4a]">.</span>
              </strong>
              <span className="hidden text-[9px] tracking-wide text-stone-500 sm:block">
                {content.brand.tagline}
              </span>
            </span>
          </a>
          <nav
            aria-label="Public navigation"
            className="hidden items-center gap-8 text-sm font-medium md:flex"
          >
            {!content.sections.hidden.includes('features') && (
              <a className="hover:text-forest" href="/#features">
                Features
              </a>
            )}
            {!content.sections.hidden.includes('steps') && (
              <a className="hover:text-forest" href="/#how-it-works">
                How it works
              </a>
            )}
            <a className="hover:text-forest" href="/pricing">
              Pricing
            </a>
            {!content.sections.hidden.includes('faq') && (
              <a className="hover:text-forest" href="/#faq">
                FAQ
              </a>
            )}
          </nav>
          <div className="hidden items-center gap-5 sm:flex">
            <a href="/login" className="text-sm font-semibold text-forest">
              Sign in
            </a>
            <a href="/signup" className="public-cta bg-forest text-white">
              Start free <ArrowUpRight size={16} />
            </a>
          </div>
          <details className="relative md:hidden">
            <summary
              className="grid size-11 cursor-pointer list-none place-items-center rounded-xl border border-forest/15"
              aria-label="Open menu"
            >
              <Menu size={21} />
            </summary>
            <nav
              aria-label="Mobile navigation"
              className="absolute right-0 top-14 flex w-56 flex-col gap-1 rounded-2xl border border-stone-200 bg-white p-3 shadow-xl"
            >
              {[
                ['Features', '/#features'],
                ['How it works', '/#how-it-works'],
                ['Pricing', '/pricing'],
                ['FAQ', '/#faq'],
                ['Sign in', '/login'],
                ['Start free', '/signup'],
              ]
                .filter(
                  ([, href]) =>
                    href !== '/#features' || !content.sections.hidden.includes('features'),
                )
                .filter(
                  ([, href]) =>
                    href !== '/#how-it-works' || !content.sections.hidden.includes('steps'),
                )
                .filter(([, href]) => href !== '/#faq' || !content.sections.hidden.includes('faq'))
                .map(([label, href]) => (
                  <a
                    className="rounded-lg px-4 py-3 text-sm hover:bg-paper"
                    key={label}
                    href={href}
                  >
                    {label}
                  </a>
                ))}
            </nav>
          </details>
        </div>
      </header>
      <main id="main-content">{children}</main>
      <footer className="border-t border-forest/10 bg-[#f0f3ea]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-5 py-10 sm:px-8">
          <div>
            <a href="/" className="font-display text-xl font-bold text-forest">
              {content.brand.name}.
            </a>
            <p className="mt-2 text-sm text-stone-500">{content.footer.description}</p>
          </div>
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-6 text-sm text-forest">
            <a href="/pricing">Pricing</a>
            {!content.sections.hidden.includes('faq') && <a href="/#faq">FAQ</a>}
            {content.footer.contact_email && (
              <a href={`mailto:${content.footer.contact_email}`}>Contact us</a>
            )}
            <a href="/login">Sign in</a>
          </nav>
        </div>
      </footer>
    </div>
  )
}
