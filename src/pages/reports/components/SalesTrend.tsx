import { useState } from 'react'
import type { PointerEvent } from 'react'
import { money } from '../../../lib/format'
import { reportPercent } from '../../../reports/money'
import { reportDate } from '../../../reports/dates'
import type { ReportDay } from '../../../reports/types'

export default function SalesTrend({ days }: { days: ReportDay[] }) {
  const [measure, setMeasure] = useState<'net_sales_centavos' | 'cash_collected_centavos'>(
    'net_sales_centavos',
  )
  const [index, setIndex] = useState(days.length - 1)
  const label =
    measure === 'net_sales_centavos' ? 'Sales before reversals' : 'Cash collected before refunds'
  const max = days.reduce(
    (value, day) => (BigInt(day[measure]) > BigInt(value) ? day[measure] : value),
    '0',
  )
  const points = days.map((day, i) => ({
    x: days.length === 1 ? 320 : 30 + (i / (days.length - 1)) * 580,
    y: 185 - reportPercent(day[measure], max) * 1.5,
  }))
  const line = points.map((point) => `${point.x},${point.y}`).join(' ')
  const selected = days[index] ?? days[days.length - 1]
  const active = points[index] ?? points[points.length - 1]
  const ticks = [...new Set([0, Math.floor((days.length - 1) / 2), days.length - 1])]
  function pointAt(event: PointerEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - bounds.left) / bounds.width) * 640
    setIndex(
      Math.max(0, Math.min(days.length - 1, Math.round(((x - 30) / 580) * (days.length - 1)))),
    )
  }
  return (
    <section className="panel min-w-0 overflow-hidden">
      <div className="panel-heading flex-wrap gap-3">
        <div>
          <h2>Daily activity</h2>
          <p className="mt-1 text-[11px] text-stone-500">Tap the chart or choose a day below</p>
        </div>
        <div
          className="flex rounded-lg bg-paper p-0.5"
          role="group"
          aria-label="Report chart measure"
        >
          {(
            [
              ['net_sales_centavos', 'Sales'],
              ['cash_collected_centavos', 'Cash collected'],
            ] as const
          ).map(([value, title]) => (
            <button
              key={value}
              aria-pressed={measure === value}
              className={`rounded-md px-3 py-2 text-[11px] ${measure === value ? 'bg-white font-semibold text-forest shadow-sm' : 'text-stone-500'}`}
              onClick={() => setMeasure(value)}
            >
              {title}
            </button>
          ))}
        </div>
      </div>
      <p className="px-5 text-[11px] text-stone-500">
        Highest day: <strong className="text-ink">{money(max)}</strong>
      </p>
      <svg
        viewBox="0 0 640 225"
        className="my-3 block w-full"
        role="img"
        aria-label={`${label} for ${days.length} Manila business days. Exact figures are available in Daily figures.`}
        onPointerMove={pointAt}
        onPointerDown={pointAt}
      >
        {[35, 85, 135, 185].map((y) => (
          <line key={y} x1="30" x2="610" y1={y} y2={y} stroke="#e7e9e0" strokeDasharray="4 5" />
        ))}
        <polyline
          points={line}
          fill="none"
          stroke="#315c46"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <line x1={active.x} x2={active.x} y1="35" y2="185" stroke="#9cb89b" strokeDasharray="3 4" />
        <circle cx={active.x} cy={active.y} r="4" fill="#315c46" />
        {ticks.map((i) => (
          <text
            key={i}
            x={points[i].x}
            y="211"
            textAnchor={
              i === 0 && days.length > 1
                ? 'start'
                : i === days.length - 1 && days.length > 1
                  ? 'end'
                  : 'middle'
            }
            fontSize="11"
            fill="#777c72"
          >
            {reportDate(days[i].date)}
          </text>
        ))}
      </svg>
      <div className="m-5 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-paper/70 p-3">
        <label className="field">
          <span>Inspect a day</span>
          <select
            aria-label="Inspect report day"
            value={selected.date}
            onChange={(event) => setIndex(days.findIndex((day) => day.date === event.target.value))}
          >
            {days.map((day) => (
              <option key={day.date} value={day.date}>
                {reportDate(day.date)}
              </option>
            ))}
          </select>
        </label>
        <div className="min-w-0">
          <p className="text-[10px] text-stone-500">{label}</p>
          <strong className="text-lg text-forest [overflow-wrap:anywhere]">
            {money(selected[measure])}
          </strong>
          <p className="text-[10px] text-stone-500">
            {selected.transactions} sales · {selected.repayment_count} repayments
          </p>
        </div>
      </div>
    </section>
  )
}
