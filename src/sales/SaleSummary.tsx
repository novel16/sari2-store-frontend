import { money } from '../lib/format'
import { saleDateTime } from './format'
import type { SaleDetail } from './types'

export default function SaleSummary({ sale }: { sale: SaleDetail }) {
  return (
    <article
      className="min-w-0 rounded-xl border border-stone-200 bg-white p-5 text-ink print:border-0 print:p-0"
      aria-label="Saved sales summary"
    >
      {sale.reversal && (
        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-950">
          <strong>
            {sale.status === 'voided' ? 'VOIDED' : 'REFUNDED'} · {sale.reversal.reference}
          </strong>
          <p>{sale.reversal.reason}</p>
          <p>
            Cash refunded: {money(sale.reversal.cash_refund_centavos)} · Utang reduced:{' '}
            {money(sale.reversal.credit_reversed_centavos)}
          </p>
          <p>{sale.reversal.restock ? 'Items returned to stock' : 'No items returned to stock'}</p>
          <p>
            {saleDateTime.format(new Date(sale.reversal.created_at))} ·{' '}
            {sale.reversal.recorded_by.name}
          </p>
          <p className="mt-2">Original sale details below are preserved.</p>
        </div>
      )}
      <div className="mb-5 text-center">
        <h2 className="break-words font-display text-lg font-bold">{sale.store.name}</h2>
        {sale.store.address && <p className="mt-1 text-xs text-stone-600">{sale.store.address}</p>}
        {sale.store.phone && <p className="mt-1 text-xs text-stone-600">{sale.store.phone}</p>}
        <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-stone-500">
          Sales summary
        </p>
        <strong className="mt-1 block text-sm">{sale.sale_number}</strong>
        <p className="mt-2 text-[11px] text-stone-600">
          {saleDateTime.format(new Date(sale.completed_at))}
        </p>
        <p className="mt-1 text-[11px] text-stone-600">Sold by {sale.sold_by.name}</p>
        {sale.customer && (
          <p className="mt-2 break-words text-xs font-semibold text-amber-900">
            Utang · {sale.customer.name}
            {sale.customer.phone && (
              <span className="mt-1 block font-normal">{sale.customer.phone}</span>
            )}
          </p>
        )}
      </div>
      <ol className="divide-y divide-dashed divide-stone-200 border-y border-dashed border-stone-200">
        {sale.items.map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-4 py-3">
            <div className="min-w-0">
              <strong className="block break-words text-xs">{item.product_name_snapshot}</strong>
              <p className="mt-1 text-[11px] text-stone-600">
                {item.quantity} × {money(item.unit_price_centavos)} / {item.unit_snapshot}
              </p>
              {item.sku_snapshot && (
                <p className="mt-1 text-[10px] text-stone-500">{item.sku_snapshot}</p>
              )}
            </div>
            <strong className="shrink-0 text-xs tabular-nums">
              {money(item.line_total_centavos)}
            </strong>
          </li>
        ))}
      </ol>
      <dl className="mt-4 space-y-2 text-xs">
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd>{money(sale.subtotal_centavos)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Discount</dt>
          <dd>−{money(sale.discount_centavos)}</dd>
        </div>
        <div className="flex items-center justify-between border-t border-stone-200 pt-3 font-bold">
          <dt>Total</dt>
          <dd className="text-xl text-forest">{money(sale.total_centavos)}</dd>
        </div>
        {sale.payment ? (
          <>
            <div className="flex justify-between pt-2">
              <dt>Cash received</dt>
              <dd>{money(sale.payment.tendered_centavos)}</dd>
            </div>
            <div className="flex justify-between font-semibold">
              <dt>Change</dt>
              <dd>{money(sale.payment.change_centavos)}</dd>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between gap-4 pt-2 font-semibold text-amber-900">
              <dt>Added to utang</dt>
              <dd>{money(sale.credit_amount_centavos)}</dd>
            </div>
            {sale.credit && (
              <div className="flex justify-between gap-4">
                <dt>Utang balance after this sale</dt>
                <dd>{money(sale.credit.balance_after_centavos)}</dd>
              </div>
            )}
          </>
        )}
      </dl>
      <p className="mt-5 text-center text-[11px] text-stone-500">
        Thank you for supporting your neighborhood store.
      </p>
    </article>
  )
}
