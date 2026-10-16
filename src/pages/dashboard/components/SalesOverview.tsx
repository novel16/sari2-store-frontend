import { useEffect, useRef, useState } from 'react'
import { EmptyState } from '../../../components/ui'
import { barPercent, chartTotals, dashboardDate, dashboardPeriods } from '../../../dashboard/format'
import type { DashboardData } from '../../../dashboard/types'
import { money } from '../../../lib/format'

export default function SalesOverview({ chart }: { chart: DashboardData['chart'] }) {
  const [view, setView] = useState<'Sales' | 'Transactions'>('Sales')
  const chartRef = useRef<HTMLDivElement>(null)
  const totals = chartTotals(chart.days)
  useEffect(() => {
    const element = chartRef.current
    if (!element) return
    const showLatestDates = () => {
      element.scrollLeft = element.scrollWidth - element.clientWidth
    }
    const observer = new ResizeObserver(showLatestDates)
    observer.observe(element)
    showLatestDates()
    return () => observer.disconnect()
  }, [chart.period, chart.date_to, totals.transactions])
  const values = chart.days.map((day) =>
    view === 'Sales' ? day.net_sales_centavos : String(day.transactions),
  )
  const maximum = values.reduce((max, value) => (BigInt(value) > BigInt(max) ? value : max), '0')
  return (
    <section className="panel min-w-0 overflow-hidden">
      <div className="panel-heading flex-wrap gap-3">
        <div>
          <h2>Sales overview</h2>
          <p className="mt-1 text-[10px] text-stone-500">
            {dashboardDate(chart.date_from)} – {dashboardDate(chart.date_to)} · Asia/Manila
          </p>
        </div>
        <div className="flex rounded-lg bg-paper p-0.5" role="group" aria-label="Chart measure">
          {(['Sales', 'Transactions'] as const).map((item) => (
            <button
              key={item}
              onClick={() => setView(item)}
              aria-pressed={item === view}
              className={`rounded-md px-3 py-2 text-[11px] ${item === view ? 'bg-white font-semibold text-forest shadow-sm' : 'text-stone-500'}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <div className="px-5">
        <strong className="font-display text-2xl font-bold [overflow-wrap:anywhere]">
          {view === 'Sales' ? money(totals.sales) : totals.transactions.toLocaleString('en-PH')}
        </strong>
        <p className="mt-1 text-[10px] text-stone-500">
          {view === 'Sales'
            ? 'Sales after discounts, before reversals'
            : 'Completed checkouts, before reversals'}{' '}
          · {dashboardPeriods[chart.period].toLowerCase()}
        </p>
      </div>
      {totals.transactions === 0 ? (
        <EmptyState
          title="No sales in this period"
          description="Completed cash and utang sales will appear here."
        />
      ) : (
        <div
          ref={chartRef}
          className="mx-5 mt-5 overflow-x-auto pb-9"
          aria-label="Daily chart. Scroll horizontally for more dates."
        >
          <div
            className="flex h-56 items-end gap-2 border-b border-stone-200 pt-8"
            style={{ minWidth: Math.max(260, chart.days.length * 38) }}
          >
            {chart.days.map((day, index) => {
              const label = `${dashboardDate(day.date)}: ${view === 'Sales' ? money(day.net_sales_centavos) : `${day.transactions} transactions`}`
              return (
                <div
                  key={day.date}
                  className="group relative flex h-full min-w-0 flex-1 flex-col justify-end text-center"
                  tabIndex={0}
                  aria-label={label}
                >
                  <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink px-2 py-1 text-[10px] text-white group-hover:block group-focus:block">
                    {view === 'Sales' ? money(day.net_sales_centavos) : day.transactions}
                  </span>
                  <div
                    className="mx-auto w-full max-w-9 rounded-t bg-forest/75 transition-colors group-hover:bg-forest group-focus:bg-forest"
                    style={{
                      height: `${BigInt(values[index]) > 0n ? Math.max(0.5, barPercent(values[index], maximum)) : 0}%`,
                    }}
                  />
                  <span className="absolute left-1/2 top-full mt-2 -translate-x-1/2 text-[10px] text-stone-500">
                    {chart.period === 'this_month'
                      ? day.date.slice(-2)
                      : new Intl.DateTimeFormat('en-PH', {
                          weekday: 'short',
                          timeZone: 'Asia/Manila',
                        }).format(new Date(`${day.date}T00:00:00+08:00`))}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
      {chart.period === 'this_month' && totals.transactions > 0 && (
        <p className="mx-5 mt-1 text-[10px] text-stone-500">
          Scroll across the chart to see earlier dates.
        </p>
      )}
      <details className="mx-5 mb-5 mt-4 text-[11px]">
        <summary className="cursor-pointer font-semibold text-forest">View daily figures</summary>
        <div className="table-wrap mt-3">
          <table className="data-table">
            <caption className="sr-only">Daily sales and transaction counts in Asia/Manila</caption>
            <thead>
              <tr>
                <th>Date</th>
                <th>Sales after discounts</th>
                <th>Transactions</th>
              </tr>
            </thead>
            <tbody>
              {chart.days.map((day) => (
                <tr key={day.date}>
                  <td className="whitespace-nowrap">{dashboardDate(day.date)}</td>
                  <td>{money(day.net_sales_centavos)}</td>
                  <td>{day.transactions.toLocaleString('en-PH')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  )
}
