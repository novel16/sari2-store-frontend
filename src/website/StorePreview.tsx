import { Check, Package, ShoppingBasket } from 'lucide-react'

export default function StorePreview() {
  return (
    <div
      className="relative mx-auto w-full max-w-xl px-2 pb-7 pt-6 sm:px-6"
      aria-label="Illustration of an organized neighborhood store"
    >
      <div className="absolute inset-4 rounded-[45%] bg-[#e5ebd8]" />
      <div className="relative rounded-t-[2rem] border-2 border-forest/15 bg-[#fffdf6] px-5 pb-7 pt-8 shadow-xl shadow-forest/10 sm:px-9">
        <div className="mx-auto mb-5 w-fit rounded-xl bg-forest px-6 py-3 font-display text-xl font-bold text-[#f1e9c9]">
          YOUR TINDAHAN
        </div>
        <div className="-mx-6 mb-6 flex h-12 overflow-hidden rounded-b-2xl border-b-4 border-forest/15 bg-[#f2d6a3] sm:-mx-10">
          {Array.from({ length: 10 }, (_, i) => (
            <span
              key={i}
              className={`flex-1 rounded-b-xl ${i % 2 ? 'bg-[#f2d6a3]' : 'bg-[#52745b]'}`}
            />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            ['bg-[#f0ddb3]', 'Bigas'],
            ['bg-[#d5e0bd]', 'Kape'],
            ['bg-[#edc6ac]', 'De lata'],
          ].map(([color, label]) => (
            <div
              key={label}
              className="rounded-xl border border-forest/10 bg-white p-3 text-center"
            >
              <Package className={`mx-auto rounded-lg p-2 text-forest ${color}`} size={46} />
              <p className="mt-3 text-xs font-semibold text-forest">{label}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-center gap-3 rounded-xl bg-forest/5 p-4">
          <ShoppingBasket size={22} className="text-forest" />
          <span className="text-sm font-medium text-forest">Products, sales & suki balances</span>
        </div>
        <p className="mt-4 text-center text-[10px] text-stone-500">Illustrative preview</p>
      </div>
      <div className="relative -mt-2 ml-auto flex w-fit items-center gap-3 rounded-2xl border border-forest/10 bg-white p-4 shadow-lg sm:-mr-2">
        <span className="grid size-9 place-items-center rounded-full bg-[#e9efdc] text-forest">
          <Check size={19} />
        </span>
        <div>
          <p className="text-xs font-bold text-forest">A little more organized.</p>
          <p className="mt-1 text-[10px] text-stone-500">A little more time for your suki.</p>
        </div>
      </div>
    </div>
  )
}
