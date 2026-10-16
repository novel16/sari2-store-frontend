import type { ReactNode } from 'react'
import { ArrowUpRight, CheckCheck, Heart, PackageCheck, ShieldCheck } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { Brand } from '../ui'
import StoreIllustration from './StoreIllustration'

const benefits = [
  { icon: PackageCheck, text: 'Easy selling' },
  { icon: CheckCheck, text: 'Clear inventory' },
  { icon: Heart, text: 'Less stress' },
]

export default function AuthLayout({
  children,
  signup = false,
}: {
  children: ReactNode
  signup?: boolean
}) {
  const { state } = useLocation()
  return (
    <div className="grid min-h-dvh grid-cols-[minmax(440px,48%)_minmax(460px,52%)] bg-[#fbfcf9] text-ink max-[1150px]:grid-cols-[46%_54%] max-[900px]:grid-cols-[42%_58%] max-[700px]:block">
      <aside className="relative flex min-h-dvh min-w-0 flex-col overflow-hidden bg-forest px-[51px] pb-7 pt-10 text-[#fffdf4] max-[1150px]:px-8 max-[900px]:px-6 max-[700px]:hidden min-[1500px]:px-[70px]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[.04]"
          style={{
            backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)',
            backgroundSize: '5px 5px',
          }}
        />
        <Link to="/login" className="relative self-start" aria-label="Sarisari login">
          <Brand light />
        </Link>

        <div className="relative z-10 mt-16 max-[900px]:mt-[73px] min-[1500px]:mt-20">
          <span className="flex items-center gap-2 text-[9px] font-semibold tracking-[2px] text-[#c0d7bd] max-[900px]:text-[7px] max-[900px]:tracking-[1.4px]">
            <span className="size-[5px] rounded-full bg-[#d8dd99]" />
            MADE FOR YOUR NEIGHBORHOOD
          </span>
          <h2 className="mb-4 mt-5 font-display text-[clamp(34px,3.45vw,54px)] font-semibold leading-[1.2] tracking-[-2px] max-[1150px]:text-[38px] max-[900px]:text-[32px] max-[900px]:tracking-[-1.2px]">
            A little store.
            <br />A lot of <span className="text-[#dae8b9]">possibilities.</span>
          </h2>
          <p className="text-[13px] leading-[1.9] text-[#c3d5cb] max-[1150px]:text-[11px] max-[900px]:text-[10px]">
            Your everyday tindahan, a little more organized.
            <br />
            More time for the things that matter.
          </p>
        </div>

        <StoreIllustration />

        <div className="relative mt-auto flex items-center justify-center gap-6 pb-7 pt-6 max-[1150px]:gap-4 max-[900px]:flex-wrap max-[900px]:justify-start max-[900px]:gap-3">
          {benefits.map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-[7px] whitespace-nowrap text-[10px] text-[#d6e1cf] max-[1150px]:text-[9px] max-[900px]:text-[8px]"
            >
              <Icon size={16} className="text-[#b2c7a1]" />
              <span>{text}</span>
            </div>
          ))}
        </div>
        <div className="relative flex items-center justify-between gap-3 border-t border-white/10 pt-[22px] text-[8px] text-[#9db8a9] max-[1150px]:text-[7px] max-[900px]:flex-col max-[900px]:items-start max-[900px]:gap-1.5">
          <span>Small business. Big heart.</span>
          <span>
            Built for the Filipino tindahan <span className="pl-1 text-[#eaa37d]">♥</span>
          </span>
        </div>
      </aside>

      <main className="relative flex min-w-0 flex-col px-[49px] pb-[26px] pt-[41px] max-[1150px]:px-[37px] max-[900px]:px-[30px] max-[700px]:min-h-dvh max-[700px]:px-[25px] max-[700px]:pb-5 max-[700px]:pt-[26px]">
        <div className="mb-6 hidden max-[700px]:block">
          <Brand />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-[7px] text-[11px] text-[#687668] max-[900px]:text-[10px] max-[700px]:absolute max-[700px]:right-[25px] max-[700px]:top-[35px] max-[700px]:max-w-[150px] max-[700px]:gap-x-[5px] max-[700px]:gap-y-[3px] max-[700px]:text-[9px]">
          {signup ? 'Already have an account?' : 'New around here?'}
          <Link
            to={signup ? '/login' : '/signup'}
            state={state}
            className="flex items-center gap-1 font-semibold text-forest hover:underline max-[700px]:text-[10px]"
          >
            {signup ? 'Sign in' : 'Create an account'}
            <ArrowUpRight size={14} />
          </Link>
        </div>

        <div
          className={`m-auto w-full max-w-[365px] min-[1500px]:max-w-[390px] max-[700px]:max-w-[380px] ${signup ? 'py-8 max-[700px]:pb-12 max-[700px]:pt-7' : 'py-12 max-[700px]:pb-12 max-[700px]:pt-9'}`}
        >
          {children}
        </div>
        <div className="flex items-center justify-between gap-2.5 text-[8px] text-[#a4aa9c] max-[700px]:justify-center">
          <span className="flex items-center gap-1.5 text-[10px] text-[#687668]">
            <ShieldCheck size={13} />
            Secure account access
          </span>
          <span className="max-[1150px]:hidden">Made for small stores, with care.</span>
        </div>
      </main>
    </div>
  )
}
