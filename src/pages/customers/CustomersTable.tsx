import { Archive, ArchiveRestore, ArrowUpRight, Banknote, Pencil } from 'lucide-react'
import { Badge } from '../../components/ui'
import type { Customer } from '../../customers/types'
import { money } from '../../lib/format'

export default function CustomersTable({
  customers,
  onSelect,
  onPayment,
  paymentLocked,
  onEdit,
  onStatus,
  onOpening,
}: {
  customers: Customer[]
  onSelect: (id: number) => void
  onPayment: (customer: Customer) => void
  paymentLocked: boolean
  onEdit: (customer: Customer) => void
  onStatus: (customer: Customer) => void
  onOpening: (customer: Customer) => void
}) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Customer</th>
            <th>Phone</th>
            <th>Status</th>
            <th className="text-right">Outstanding</th>
            <th>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id}>
              <td>
                <div className="flex items-center gap-2">
                  <button
                    className="text-left font-semibold text-forest hover:underline"
                    onClick={() => onSelect(customer.id)}
                  >
                    {customer.name}
                  </button>
                  {customer.status === 'archived' && <Badge>Archived</Badge>}
                </div>
                <span className="mt-1 block text-[10px] text-stone-500">
                  Customer #{customer.id}
                </span>
              </td>
              <td>{customer.phone || '—'}</td>
              <td>
                <Badge tone={BigInt(customer.balance_centavos) > 0n ? 'orange' : 'green'}>
                  {BigInt(customer.balance_centavos) > 0n ? 'With utang' : 'Settled'}
                </Badge>
              </td>
              <td className="text-right font-semibold tabular-nums">
                {money(customer.balance_centavos)}
              </td>
              <td>
                <div className="flex flex-wrap items-center justify-end gap-1">
                  {BigInt(customer.balance_centavos) > 0n && (
                    <button
                      className="btn btn-secondary whitespace-nowrap"
                      disabled={paymentLocked}
                      onClick={() => onPayment(customer)}
                      aria-label={`Record payment for ${customer.name}`}
                    >
                      <Banknote size={14} />
                      Record payment
                    </button>
                  )}
                  {customer.can_record_opening_balance && (
                    <button
                      className="btn btn-secondary whitespace-nowrap"
                      disabled={paymentLocked}
                      onClick={() => onOpening(customer)}
                    >
                      Opening utang
                    </button>
                  )}
                  <button
                    className="icon-button"
                    disabled={paymentLocked}
                    onClick={() => onEdit(customer)}
                    aria-label={`Edit ${customer.name}`}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="icon-button"
                    disabled={paymentLocked}
                    onClick={() => onStatus(customer)}
                    aria-label={`${customer.status === 'active' ? 'Archive' : 'Restore'} ${customer.name}`}
                  >
                    {customer.status === 'active' ? (
                      <Archive size={16} />
                    ) : (
                      <ArchiveRestore size={16} />
                    )}
                  </button>
                  <button
                    className="icon-button"
                    aria-label={`View ${customer.name}'s ledger`}
                    onClick={() => onSelect(customer.id)}
                  >
                    <ArrowUpRight size={17} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
