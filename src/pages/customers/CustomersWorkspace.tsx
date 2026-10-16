import { useState } from 'react'
import { Banknote, CreditCard, Plus, Search, Users, Wallet } from 'lucide-react'
import { EmptyState, PageHeader, StatCard } from '../../components/ui'
import { QueryState } from '../../components/ui/QueryState'
import { Pagination } from '../../components/ui/Pagination'
import { storePath } from '../../catalog/api'
import CustomerFormDialog from '../../customers/CustomerFormDialog'
import type { Customer, CustomersPageResponse, CustomerSelection } from '../../customers/types'
import { useRepayment } from '../../customers/repayments/useRepayment'
import RepaymentDialog from '../../customers/repayments/RepaymentDialog'
import RepaymentSavedDialog from '../../customers/repayments/RepaymentSavedDialog'
import { useStoreQuery } from '../../hooks/useStoreQuery'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { money } from '../../lib/format'
import CustomersTable from './CustomersTable'
import CustomerLedgerDialog from './CustomerLedgerDialog'
import CustomerEditDialog from '../../customers/CustomerEditDialog'
import CustomerStatusDialog from '../../customers/CustomerStatusDialog'
import OpeningBalanceDialog from '../../customers/opening/OpeningBalanceDialog'
import { useOpeningBalance } from '../../customers/opening/useOpeningBalance'

export default function CustomersWorkspace({
  userId,
  storeId,
}: {
  userId: number
  storeId: number
}) {
  const [search, setSearch] = useState('')
  const [balance, setBalance] = useState('all')
  const [status, setStatus] = useState('active')
  const [editing, setEditing] = useState<Customer | null>(null)
  const [changingStatus, setChangingStatus] = useState<Customer | null>(null)
  const [openingCustomer, setOpeningCustomer] = useState<Pick<
    CustomerSelection,
    'id' | 'name'
  > | null>(null)
  const [notice, setNotice] = useState('')
  const [page, setPage] = useState(1)
  const [adding, setAdding] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)
  const [paying, setPaying] = useState<CustomerSelection | null>(null)
  const debounced = useDebouncedValue(search)
  const query = new URLSearchParams({
    q: debounced,
    balance,
    status,
    page: String(page),
    per_page: '20',
  })
  const result = useStoreQuery<CustomersPageResponse>(`${storePath(storeId)}/customers?${query}`)
  const repayment = useRepayment(userId, storeId, result.reload)
  const opening = useOpeningBalance(userId, storeId, result.reload)
  const paymentLocked =
    repayment.pending || Boolean(repayment.attempt) || opening.pending || Boolean(opening.attempt)
  function changed(message: string) {
    setEditing(null)
    setChangingStatus(null)
    setNotice(message)
    result.reload()
  }
  function openPayment(customer: CustomerSelection) {
    if (paymentLocked) return
    repayment.clearError()
    setSelected(customer.id)
    setPaying(customer)
  }
  const summary = result.data?.meta.summary
  return (
    <>
      <PageHeader
        eyebrow="GOOD NEIGHBORS, GOOD BUSINESS"
        title="Customers & utang"
        description="Your saved customers and the utang recorded at checkout."
        actions={
          <button className="btn btn-primary" onClick={() => setAdding(true)}>
            <Plus size={16} />
            Add customer
          </button>
        }
      />
      {repayment.attempt && !paying && (
        <div
          role="status"
          className="my-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900"
        >
          <span>
            A cash payment for <strong>{repayment.attempt.customer.name}</strong> needs
            confirmation.
          </span>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setSelected(repayment.attempt!.customer.id)
              setPaying(repayment.attempt!.customer)
            }}
          >
            Check pending payment
          </button>
        </div>
      )}
      <div className="stats-grid">
        <StatCard
          label="Outstanding utang"
          value={summary ? money(summary.outstanding_centavos) : '—'}
          icon={<CreditCard size={19} />}
          note="Includes active and archived customers"
        />
        <StatCard
          label="Total customers"
          value={summary ? String(summary.customers) : '—'}
          icon={<Users size={19} />}
          note="Active and archived records"
        />
        <StatCard
          label="Customers with utang"
          value={summary ? String(summary.with_balance) : '—'}
          icon={<Wallet size={19} />}
          note="With an outstanding balance"
        />
        <StatCard
          label="Utang collected"
          value={summary ? money(summary.collections_centavos) : '—'}
          icon={<Banknote size={19} />}
          note="All-time cash repayments"
        />
      </div>
      {notice && (
        <p role="status" className="mt-4 rounded-lg bg-forest/5 p-4 text-xs text-forest">
          {notice}
        </p>
      )}
      {opening.attempt && !openingCustomer && (
        <div
          role="status"
          className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-amber-50 p-4 text-xs text-amber-900"
        >
          <span>
            Opening utang for <strong>{opening.attempt.customer_name}</strong> needs confirmation.
          </span>
          <button
            className="btn btn-secondary"
            onClick={() =>
              setOpeningCustomer({
                id: opening.attempt!.customer_id,
                name: opening.attempt!.customer_name,
              })
            }
          >
            Check pending opening
          </button>
        </div>
      )}
      <section className="panel mt-6 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <label className="search-field sm:max-w-72">
            <Search size={16} />
            <input
              aria-label="Search customers"
              placeholder="Search name or phone…"
              maxLength={120}
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
            />
          </label>
          <label className="field">
            <span>Balance</span>
            <select
              aria-label="Customer balance filter"
              value={balance}
              onChange={(event) => {
                setBalance(event.target.value)
                setPage(1)
              }}
            >
              <option value="all">All customers</option>
              <option value="outstanding">With utang</option>
              <option value="settled">Settled</option>
            </select>
          </label>
          <label className="field">
            <span>Customer status</span>
            <select
              aria-label="Customer status filter"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                setPage(1)
              }}
            >
              <option value="active">Active customers</option>
              <option value="archived">Archived customers</option>
              <option value="all">All customers</option>
            </select>
          </label>
        </div>
        <QueryState loading={result.isLoading} error={result.error} retry={result.reload} />
        {result.data && (
          <>
            <CustomersTable
              customers={result.data.data}
              onSelect={setSelected}
              onPayment={openPayment}
              paymentLocked={paymentLocked}
              onEdit={setEditing}
              onStatus={setChangingStatus}
              onOpening={(customer) => {
                opening.reset()
                setOpeningCustomer(customer)
              }}
            />
            {!result.data.data.length && (
              <EmptyState
                title="No customers found"
                description="Add a customer here or directly from the Utang section in POS."
              />
            )}
            <div className="border-t border-stone-100 px-5 pb-5">
              <Pagination meta={result.data.meta} onPage={setPage} />
            </div>
          </>
        )}
      </section>
      {adding && (
        <CustomerFormDialog
          storeId={storeId}
          onClose={() => setAdding(false)}
          onCreated={() => {
            setAdding(false)
            result.reload()
          }}
        />
      )}
      {editing && (
        <CustomerEditDialog
          storeId={storeId}
          customer={editing}
          onClose={() => setEditing(null)}
          onSaved={() => changed('Customer details saved.')}
        />
      )}
      {changingStatus && (
        <CustomerStatusDialog
          storeId={storeId}
          customer={changingStatus}
          onClose={() => setChangingStatus(null)}
          onSaved={() =>
            changed(
              changingStatus.status === 'active'
                ? 'Customer archived. Their balance and history are preserved.'
                : 'Customer restored.',
            )
          }
        />
      )}
      {openingCustomer && (
        <OpeningBalanceDialog
          key={openingCustomer.id}
          customer={openingCustomer}
          opening={opening}
          onClose={() => {
            setOpeningCustomer(null)
            opening.reset()
            result.reload()
          }}
        />
      )}
      {selected && !paying && !repayment.receipt && (
        <CustomerLedgerDialog
          key={`${selected}:${repayment.revision}`}
          storeId={storeId}
          customerId={selected}
          onPayment={openPayment}
          paymentLocked={paymentLocked}
          onClose={() => {
            setSelected(null)
            result.reload()
          }}
        />
      )}
      {paying && !repayment.receipt && (
        <RepaymentDialog
          key={paying.id}
          storeId={storeId}
          customer={paying}
          repayment={repayment}
          onClose={() => setPaying(null)}
        />
      )}
      {repayment.receipt && (
        <RepaymentSavedDialog
          reply={repayment.receipt}
          onClose={() => {
            setSelected(repayment.receipt!.customer.id)
            repayment.closeReceipt()
            setPaying(null)
          }}
        />
      )}
    </>
  )
}
