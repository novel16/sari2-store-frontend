import { money } from '../../../lib/format'
import { reportDate } from '../../../reports/dates'
import type { ReportDay } from '../../../reports/types'

export default function DailyFigures({ days }: { days: ReportDay[] }) {
  return (
    <details className="panel min-w-0 overflow-hidden">
      <summary className="cursor-pointer p-5 text-sm font-semibold text-forest">
        Daily figures · {days.length} {days.length === 1 ? 'day' : 'days'}
      </summary>
      <div className="table-wrap max-h-96 overflow-auto">
        <table className="data-table">
          <caption className="sr-only">
            Daily sales and collections in Asia/Manila for the applied date range
          </caption>
          <thead>
            <tr>
              <th>Date</th>
              <th>Transactions</th>
              <th>Units sold</th>
              <th>Gross sales</th>
              <th>Discounts</th>
              <th>Sales after discounts</th>
              <th>Cash sales</th>
              <th>Utang sales</th>
              <th>Repayments</th>
              <th>Cash from repayments</th>
              <th>Total cash collected</th>
              <th>Reversals</th>
              <th>Sales reversed</th>
              <th>Cash refunds</th>
              <th>Net sales after reversals</th>
              <th>Net cash collected</th>
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <tr key={day.date}>
                <td className="whitespace-nowrap">{reportDate(day.date)}</td>
                <td>{day.transactions}</td>
                <td>{BigInt(day.units_sold).toLocaleString('en-PH')}</td>
                {[
                  day.gross_sales_centavos,
                  day.discounts_centavos,
                  day.net_sales_centavos,
                  day.cash_sales_centavos,
                  day.credit_sales_centavos,
                ].map((amount, index) => (
                  <td key={index} className="whitespace-nowrap">
                    {money(amount)}
                  </td>
                ))}
                <td>{day.repayment_count}</td>
                <td className="whitespace-nowrap">{money(day.repayments_centavos)}</td>
                <td className="whitespace-nowrap font-semibold">
                  {money(day.cash_collected_centavos)}
                </td>
                <td>{day.reversal_count}</td>
                {[
                  day.reversed_sales_centavos,
                  day.cash_refunds_centavos,
                  day.net_after_reversals_centavos,
                  day.net_cash_collected_centavos,
                ].map((amount, index) => (
                  <td key={`return-${index}`} className="whitespace-nowrap">
                    {money(amount)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="p-5 text-[11px] text-stone-500">
        Includes days without activity. Scroll across for the full breakdown. All daily figures are
        included in the CSV.
      </p>
    </details>
  )
}
