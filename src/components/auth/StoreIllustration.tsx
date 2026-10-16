import { ArrowUpRight, Check, TrendingUp } from 'lucide-react'

export default function StoreIllustration() {
  return (
    <div
      className="relative mx-auto mt-5 w-full max-w-[450px] shrink-0 select-none max-[1150px]:scale-90 max-[900px]:w-[340px] max-[900px]:-translate-x-3 max-[900px]:scale-85"
      aria-hidden="true"
    >
      <svg
        className="block h-auto w-full overflow-visible"
        viewBox="0 0 450 310"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="store-shadow" x="0" y="0" width="200%" height="200%">
            <feDropShadow dx="0" dy="12" stdDeviation="8" floodColor="#102c2a" floodOpacity=".18" />
          </filter>
          <linearGradient
            id="awning"
            x1="0"
            y1="111"
            x2="0"
            y2="145"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#ea9068" />
            <stop offset="1" stopColor="#dc7951" />
          </linearGradient>
        </defs>
        <circle cx="225" cy="150" r="145" stroke="#d5e3b3" strokeOpacity=".14" />
        <circle cx="225" cy="150" r="185" stroke="#d5e3b3" strokeOpacity=".08" />
        <path
          d="M55 51l3 10 10 3-10 3-3 10-3-10-10-3 10-3 3-10Z"
          stroke="#d9e4b0"
          strokeWidth="1.5"
        />
        <path d="m404 119 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z" fill="#d9e4b0" />
        <ellipse cx="228" cy="281" rx="154" ry="10" fill="#143d31" />
        <g filter="url(#store-shadow)">
          <path d="M94 54a8 8 0 0 1 8-8h246a8 8 0 0 1 8 8v16H94V54Z" fill="#c7d3a6" />
          <text x="109" y="61" fill="#375542" fontSize="5" letterSpacing="1.6" fontWeight="800">
            MABUHAY!
          </text>
          <text x="305" y="61" fill="#375542" fontSize="5" letterSpacing="1.2" fontWeight="800">
            EST. 2024
          </text>
          <path fill="#e2d6b6" d="M102 70h246v52H102z" />
          <path fill="#faf1d4" d="M107 75h236v47H107z" />
          <text
            x="225"
            y="99"
            textAnchor="middle"
            fill="#2d5748"
            fontFamily="Georgia, serif"
            fontSize="25"
            fontWeight="600"
          >
            Aling Nena’s
          </text>
          <text
            x="225"
            y="113"
            textAnchor="middle"
            fill="#43634d"
            fontSize="6"
            fontWeight="600"
            letterSpacing="2.7"
          >
            SARI-SARI STORE
          </text>
          <path fill="#f1e7cb" d="M102 138h246v128H102z" />
          <path fill="#e3d6b5" d="M110 146h230v120H110z" />
          <path fill="#c8bf9c" d="M119 151h145v97H119z" />
          <path fill="#234c40" d="M124 156h135v87H124z" />
          <path fill="#b7b38c" d="M278 150h50v116h-50z" />
          <path fill="#315748" d="M282 154h42v112h-42z" />
          <rect x="317" y="202" width="3" height="11" rx="1.5" fill="#d7c391" />
          <path d="m288 173 32-3 2 19-32 3-2-19Z" fill="#f2e3b9" />
          <text
            x="305"
            y="184"
            textAnchor="middle"
            fill="#49624d"
            fontSize="7"
            fontWeight="800"
            letterSpacing="1"
          >
            OPEN
          </text>
          <rect x="135" y="167" width="21" height="23" rx="2" fill="#df8458" />
          <path fill="#f7d1a9" d="M139 174h13v6h-13z" />
          <rect x="211" y="168" width="22" height="22" rx="2" fill="#f4e9ce" />
          <path fill="#c5c59a" d="M215 175h14v5h-14z" />
          <path fill="#dbbc70" d="M167 168a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v22h-12v-22Z" />
          <path fill="#e6d9a6" d="M170 160h6v5h-6z" />
          <path fill="#f2e4b4" d="M167 173h12v8h-12z" />
          <path fill="#82a47f" d="M190 170a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v20h-12v-20Z" />
          <path fill="#e6d9a6" d="M193 162h6v5h-6z" />
          <path fill="#f2e4b4" d="M190 175h12v8h-12z" />
          <rect x="133" y="202" width="21" height="24" rx="2" fill="#e7bd5f" />
          <path fill="#f7e5b4" d="M137 209h13v7h-13z" />
          <rect x="164" y="208" width="21" height="18" rx="2" fill="#df8458" />
          <path fill="#f7d1a9" d="M168 213h13v6h-13z" />
          <rect x="195" y="203" width="22" height="23" rx="2" fill="#f4e9ce" />
          <path fill="#c5c59a" d="M199 210h14v6h-14z" />
          <path fill="#82a47f" d="M230 205a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v21h-12v-21Z" />
          <path fill="#e6d9a6" d="M233 197h6v5h-6z" />
          <path fill="#f2e4b4" d="M230 211h12v8h-12z" />
          <path fill="#a3ac81" d="M124 190h135v4H124zm0 36h135v4H124z" />
          <text x="191" y="238" textAnchor="middle" fill="#e1e6c8" fontSize="4.7" letterSpacing="1">
            YOUR DAILY ESSENTIALS
          </text>
          {Array.from({ length: 8 }, (_, index) => (
            <path
              key={index}
              d={`M${86 + index * 35} 121h35v15a11 11 0 0 1-11 11h-13a11 11 0 0 1-11-11v-15Z`}
              fill={index % 2 ? '#fff1cf' : 'url(#awning)'}
            />
          ))}
          <path d="M86 121h280l-9-8H95l-9 8Z" fill="#f3d3a5" />
          <rect x="93" y="266" width="265" height="8" rx="2" fill="#c3c5a7" />
          <path fill="#99ae92" d="M96 271h259v4H96z" />
        </g>
        <path d="M362 258c-22-8-23-23-19-31 12 2 21 16 19 31Z" fill="#83a474" />
        <path d="M365 257c0-22 10-31 20-31 2 13-7 26-20 31Z" fill="#a3b888" />
        <path d="M363 249c-9-20-4-33 4-38 8 11 7 27-4 38Z" fill="#71936c" />
        <path d="M350 253h28l-3 25h-22l-3-25Z" fill="#c18458" />
        <path fill="#d69b6a" d="M348 252h32v5h-32z" />
      </svg>
      <div className="absolute -right-2 top-[100px] flex rotate-[5deg] items-center gap-2 rounded-xl border border-white/30 bg-[#fffdf3] px-3 py-3 text-forest shadow-xl shadow-black/10 max-[900px]:right-[-5px]">
        <span className="grid size-8 place-items-center rounded-lg bg-[#e6eddb] text-[#668949]">
          <TrendingUp size={17} />
        </span>
        <div>
          <span className="block text-[8px] text-[#7a8774]">Today’s sales</span>
          <strong className="mt-0.5 flex items-center gap-2 font-display text-[16px]">
            ₱4,850
            <span className="flex items-center gap-0.5 text-[7px] text-[#54855f]">
              +18.6%
              <ArrowUpRight size={11} />
            </span>
          </strong>
        </div>
        <div className="ml-1 flex h-8 items-end gap-[3px]">
          {[14, 18, 12, 23, 20, 27, 31].map((height, index) => (
            <i
              key={index}
              className={`block w-1 rounded-sm ${index === 6 ? 'bg-[#e89460]' : 'bg-[#a8bd8d]'}`}
              style={{ height }}
            />
          ))}
        </div>
      </div>
      <div className="absolute -left-1 bottom-5 flex -rotate-[5deg] items-center gap-2.5 rounded-xl border border-white/30 bg-[#fffdf3] px-4 py-3 text-forest shadow-xl shadow-black/10">
        <span className="grid size-8 place-items-center rounded-full bg-[#e9edda] text-[#739052]">
          <Check size={18} />
        </span>
        <div>
          <strong className="block text-[10px]">Stock, sorted.</strong>
          <span className="mt-1 block text-[7px] text-[#7b8979]">
            A little less worry, every day.
          </span>
        </div>
      </div>
    </div>
  )
}
