import { Fragment } from 'react'
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  ChevronDown,
  HeartHandshake,
  PackageCheck,
  ShoppingBasket,
} from 'lucide-react'
import PublicLayout from '../layouts/PublicLayout'
import StorePreview from './StorePreview'
import PricingCards from './PricingCards'
import type { PublicSiteData } from './types'

export default function PublicSite({
  data,
  path = '/',
  preview = false,
}: {
  data: PublicSiteData
  path?: string
  preview?: boolean
}) {
  const c = data.content,
    pricing = path === '/pricing'
  const icons = [ShoppingBasket, PackageCheck, HeartHandshake, BarChart3]
  const sections = {
    features: (
      <section
        id="features"
        className="scroll-mt-24 border-y border-forest/10 bg-[#f0f3e9] px-5 py-16 sm:px-8 sm:py-24"
      >
        <div className="mx-auto max-w-7xl">
          <p className="public-eyebrow">BUILT AROUND YOUR EVERYDAY</p>
          <h2 className="public-heading mx-auto mt-4 max-w-3xl text-center">
            {c.home.features_title}
          </h2>
          <p className="public-intro mx-auto mt-5 max-w-2xl text-center">{c.home.features_intro}</p>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {c.features.map((feature, i) => {
              const Icon = icons[i % icons.length]
              return (
                <article key={i} className="rounded-2xl border border-forest/10 bg-[#fbfcf8] p-6">
                  <span className="grid size-12 place-items-center rounded-2xl bg-[#e4ead7] text-forest">
                    <Icon size={24} />
                  </span>
                  <h3 className="mt-6 text-lg font-bold text-forest">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-stone-500">{feature.body}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>
    ),
    steps: (
      <section
        id="how-it-works"
        className="mx-auto max-w-7xl scroll-mt-24 px-5 py-16 sm:px-8 sm:py-24"
      >
        <p className="public-eyebrow">A FRESH START FOR YOUR STORE</p>
        <h2 className="public-heading mt-4 text-center">{c.home.steps_title}</h2>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {c.steps.map((step, i) => (
            <article key={i} className="border-t border-forest/15 pt-6">
              <span className="font-display text-4xl font-semibold text-[#c1cdac]">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-5 text-xl font-semibold text-forest">{step.title}</h3>
              <p className="mt-3 text-sm leading-7 text-stone-500">{step.body}</p>
            </article>
          ))}
        </div>
      </section>
    ),
    pricing: (
      <section className="border-y border-forest/10 bg-[#f7f4eb] px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <p className="public-eyebrow">ROOM TO GROW</p>
          <h2 className="public-heading mt-4 text-center">{c.home.pricing_title}</h2>
          <p className="public-intro mx-auto mt-5 max-w-2xl text-center">{c.home.pricing_intro}</p>
          <div className="mt-12">
            <PricingCards data={data} />
          </div>
          <p className="mt-7 text-center">
            <a
              href="/pricing"
              className="inline-flex items-center gap-2 text-sm font-semibold text-forest"
            >
              Explore pricing
              <ArrowRight size={15} />
            </a>
          </p>
        </div>
      </section>
    ),
    faq: (
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-24 px-5 py-16 sm:px-8 sm:py-24">
        <p className="public-eyebrow">A FEW THINGS YOU MIGHT BE WONDERING</p>
        <h2 className="public-heading mt-4 text-center">{c.home.faq_title}</h2>
        <div className="mt-9">
          {c.faqs.map((faq, i) => (
            <details key={i} className="group border-b border-forest/15 py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-forest [&::-webkit-details-marker]:hidden">
                {faq.question}
                <ChevronDown size={18} className="shrink-0 transition group-open:rotate-180" />
              </summary>
              <p className="mt-4 text-sm leading-7 text-stone-500">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>
    ),
  }
  return (
    <PublicLayout content={c} preview={preview}>
      {pricing ? (
        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
          <p className="public-eyebrow">SIMPLE PLANS, EVERYDAY POSSIBILITIES</p>
          <h1 className="public-title mx-auto mt-5 max-w-4xl text-center">{c.pricing.headline}</h1>
          <p className="public-intro mx-auto mt-6 max-w-2xl text-center">{c.pricing.intro}</p>
          <div className="mt-12">
            <PricingCards data={data} />
          </div>
          <p className="mt-7 text-center text-sm leading-relaxed text-stone-500">
            Product allowances count active product entries, not stock quantity. Coming-soon plans
            are not available for purchase.
          </p>
        </section>
      ) : (
        <>
          <section className="mx-auto grid max-w-7xl items-center gap-9 px-5 pb-16 pt-12 sm:px-8 sm:py-20 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
            <div>
              <p className="text-xs font-bold tracking-[.18em] text-[#67815c]">{c.home.eyebrow}</p>
              <h1 className="public-title mt-6">{c.home.headline}</h1>
              <p className="public-intro mt-6 max-w-xl">{c.home.intro}</p>
              <div className="mt-9 flex flex-wrap items-center gap-5">
                <a className="public-cta bg-forest text-white" href="/signup">
                  {c.home.cta_label}
                  <ArrowUpRight size={18} />
                </a>
                {!c.sections.hidden.includes('steps') && (
                  <a
                    className="inline-flex items-center gap-2 text-sm font-semibold text-forest"
                    href="/#how-it-works"
                  >
                    See how it works
                    <ArrowRight size={16} />
                  </a>
                )}
              </div>
              <p className="mt-5 text-xs text-stone-500">Start with Free. No credit card needed.</p>
            </div>
            {c.media.hero_url ? (
              <img
                src={c.media.hero_url}
                alt={c.media.hero_alt}
                width="1200"
                height="900"
                fetchPriority="high"
                className="w-full rounded-3xl object-contain"
              />
            ) : (
              <StorePreview />
            )}
          </section>

          {c.sections.order
            .filter((name) => !c.sections.hidden.includes(name))
            .map((name) => (
              <Fragment key={name}>{sections[name]}</Fragment>
            ))}
        </>
      )}

      {pricing && !c.sections.hidden.includes('faq') && sections.faq}
      <section className="px-5 pb-16 sm:px-8 sm:pb-24">
        <div className="mx-auto max-w-7xl rounded-[2rem] bg-forest px-6 py-12 text-center sm:p-16">
          <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {c.home.final_title}
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-white/70">
            {c.home.final_intro}
          </p>
          <a href="/signup" className="public-cta mt-8 bg-[#e8cf97] text-forest">
            {c.home.cta_label}
            <ArrowUpRight size={17} />
          </a>
        </div>
      </section>
    </PublicLayout>
  )
}
