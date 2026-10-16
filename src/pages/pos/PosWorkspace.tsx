import { useReducer, useRef, useState } from 'react'
import { Barcode, RefreshCw, RotateCcw } from 'lucide-react'
import { Badge, PageHeader } from '../../components/ui'
import FormError from '../../auth/components/FormError'
import { useMutation } from '../../hooks/useMutation'
import { salesApi } from '../../sales/api'
import SaleSummaryDialog from '../../sales/SaleSummaryDialog'
import { cartReducer, cartTotals } from './cart'
import { checkoutStorageKey, readAttempt } from './recovery'
import { useCheckout } from './useCheckout'
import { usePosCatalog } from './usePosCatalog'
import ProductCatalog from './ProductCatalog'
import CartPanel from './CartPanel'
import BarcodeDialog from './BarcodeDialog'
import CheckoutRecovery from './CheckoutRecovery'
import CheckoutConfirmationDialog from './CheckoutConfirmationDialog'
import CustomerFormDialog from '../../customers/CustomerFormDialog'
import type { CustomerSelection } from '../../customers/types'
import { customersApi } from '../../customers/api'
import { draftStorageKey, hasDraft, readDraft } from './draft'
import { useDraftPersistence } from './useDraftPersistence'
import ClearOrderDialog from './ClearOrderDialog'

export default function PosWorkspace({
  storeId,
  userId,
  storeName,
  ownerName,
}: {
  storeId: number
  userId: number
  storeName: string
  ownerName: string
}) {
  const storageKey = checkoutStorageKey(userId, storeId)
  const draftKey = draftStorageKey(userId, storeId)
  const [initial] = useState(() => {
    try {
      return readAttempt(sessionStorage, storageKey)
    } catch {
      return null
    }
  })
  const [draft] = useState(() => {
    try {
      return initial ? null : readDraft(sessionStorage, draftKey, storeId)
    } catch {
      return null
    }
  })
  const [needsRefresh, setNeedsRefresh] = useState(Boolean(draft?.lines.length))
  const [clearing, setClearing] = useState(false)
  const [cart, dispatch] = useReducer(cartReducer, {
    lines: initial?.lines ?? draft?.lines ?? [],
    notice: '',
  })
  const [cash, setCash] = useState(
    initial?.input.payment.method === 'cash'
      ? (initial.input.payment.tendered_centavos / 100).toFixed(2)
      : (draft?.cash ?? ''),
  )
  const [discount, setDiscount] = useState(
    initial ? (initial.input.discount_centavos / 100).toFixed(2) : (draft?.discount ?? '0.00'),
  )
  const [barcodeOpen, setBarcodeOpen] = useState(false)
  const [method, setMethod] = useState<'cash' | 'credit'>(
    initial?.input.payment.method ?? draft?.method ?? 'cash',
  )
  const [customer, setCustomer] = useState<CustomerSelection | null>(
    initial?.customer ?? draft?.customer ?? null,
  )
  const [addingCustomer, setAddingCustomer] = useState<string | null>(null)
  const [reviewOpen, setReviewOpen] = useState(false)
  const confirming = useRef(false)
  const [mobilePane, setMobilePane] = useState<'products' | 'order'>('products')
  const catalog = usePosCatalog(storeId)
  const refreshing = useMutation()
  async function refreshCart() {
    return refreshing.run(async () => {
      if (!cart.lines.length) return
      const refreshedCustomer = customer
        ? (await customersApi.show(storeId, customer.id)).data
        : null
      const products = await salesApi.products(
        storeId,
        cart.lines.map((line) => line.product.id),
      )
      const found = new Map(products.map((product) => [product.id, product]))
      dispatch({
        type: 'replace',
        lines: cart.lines.map((line) => ({
          ...line,
          product: found.get(line.product.id) ?? {
            ...line.product,
            status: 'archived',
            inventory: { ...line.product.inventory, quantity_on_hand: 0 },
          },
        })),
      })
      setCustomer(refreshedCustomer?.status === 'active' ? refreshedCustomer : null)
      setNeedsRefresh(false)
      catalog.reload()
    })
  }
  function clear() {
    setReviewOpen(false)
    setMethod('cash')
    setCustomer(null)
    dispatch({ type: 'clear' })
    setCash('')
    setDiscount('0.00')
    setMobilePane('products')
    setNeedsRefresh(false)
    setClearing(false)
    try {
      sessionStorage.removeItem(draftKey)
    } catch {
      /* Persistence warns if storage is unavailable. */
    }
  }
  const checkout = useCheckout(
    storeId,
    storageKey,
    initial,
    () => {
      clear()
      catalog.reload()
    },
    refreshCart,
    draftKey,
  )
  const checkoutLocked = checkout.pending || Boolean(checkout.attempt) || refreshing.pending
  const locked = checkoutLocked || reviewOpen || addingCustomer !== null || clearing
  const totals = cartTotals(cart.lines, discount, cash, method, customer?.id)
  if (needsRefresh) {
    totals.valid = false
    totals.reason = 'Refresh the restored order to check current prices and stock.'
  }
  if (method === 'credit' && customer?.status === 'archived') {
    totals.valid = false
    totals.reason = 'Select an active customer for this utang sale.'
  }
  const draftError = useDraftPersistence(
    draftKey,
    { version: 1, store_id: storeId, lines: cart.lines, cash, discount, method, customer },
    Boolean(checkout.attempt),
  )
  function requestClear() {
    if (locked) return
    if (hasDraft({ lines: cart.lines, cash, discount, method, customer })) setClearing(true)
    else {
      clear()
      checkout.clearError()
    }
  }

  function cancelReview() {
    if (!confirming.current) setReviewOpen(false)
  }

  async function confirmSale() {
    if (confirming.current || checkoutLocked || !reviewOpen || !totals.valid) return
    confirming.current = true
    try {
      await checkout.complete(
        cart.lines,
        totals.discount,
        totals.tendered,
        method === 'credit' && customer ? customer : undefined,
      )
    } finally {
      confirming.current = false
      setReviewOpen(false)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="A GOOD DAY STARTS WITH A SALE"
        title="Point of sale"
        description="A quick checkout. A familiar face. Your store, in its flow."
        actions={
          <>
            <button className="btn btn-secondary" disabled={locked} onClick={requestClear}>
              <RotateCcw size={14} />
              New order
            </button>
            <button
              className="btn btn-primary"
              disabled={locked}
              onClick={() => setBarcodeOpen(true)}
            >
              <Barcode size={16} />
              Enter barcode
            </button>
          </>
        }
      />
      <div className="mb-6 mt-4 flex flex-wrap items-center justify-between gap-3 text-[11px] text-stone-500">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="green">Store register</Badge>
          <span>{storeName}</span>
          <span>·</span>
          <span>{ownerName}</span>
        </div>
        <button
          className="flex items-center gap-1.5 hover:text-forest"
          disabled={locked || !cart.lines.length}
          onClick={() => void refreshCart()}
        >
          <RefreshCw size={13} />
          Refresh cart
        </button>
      </div>
      {checkout.attempt && !checkout.pending && !reviewOpen && (
        <CheckoutRecovery
          pending={checkout.pending}
          error={checkout.error}
          onCheck={() => void checkout.check()}
          onRetry={() => void checkout.retry()}
        />
      )}
      {checkout.pending && (
        <p role="status" className="mb-4 rounded-lg bg-forest/5 p-4 text-xs text-forest">
          Saving or checking your sale. Please wait…
        </p>
      )}
      {cart.notice && (
        <p role="status" className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-xs text-amber-800">
          {cart.notice}
        </p>
      )}
      <FormError error={refreshing.error} />
      {draftError && (
        <p role="alert" className="mb-4 rounded-lg bg-amber-50 p-4 text-xs text-amber-900">
          {draftError}
        </p>
      )}
      {needsRefresh && (
        <div
          role="status"
          className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-forest/5 p-4 text-xs text-forest"
        >
          <span>Your saved order is restored. Check current prices and stock before checkout.</span>
          <button
            className="btn btn-secondary"
            disabled={locked}
            onClick={() => void refreshCart()}
          >
            Refresh restored order
          </button>
        </div>
      )}
      <div
        className="tabs sticky top-[80px] z-20 mb-4 border border-white bg-[#ecefe7]/95 shadow-sm backdrop-blur xl:hidden"
        aria-label="Point of sale panels"
      >
        <button
          className={`tab flex-1 ${mobilePane === 'products' ? 'active' : ''}`}
          onClick={() => setMobilePane('products')}
          aria-pressed={mobilePane === 'products'}
        >
          Products
        </button>
        <button
          className={`tab flex-1 ${mobilePane === 'order' ? 'active' : ''}`}
          onClick={() => setMobilePane('order')}
          aria-pressed={mobilePane === 'order'}
        >
          Current order{' '}
          <span className="rounded bg-forest/5 px-1.5 text-[10px]">
            {cart.lines.reduce((sum, line) => sum + line.quantity, 0)}
          </span>
        </button>
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_350px]">
        <div className={`min-w-0 ${mobilePane === 'products' ? 'block' : 'hidden'} xl:block`}>
          <ProductCatalog
            catalog={catalog}
            disabled={locked}
            onAdd={(product) => dispatch({ type: 'add', product })}
          />
        </div>
        <div className={`min-w-0 ${mobilePane === 'order' ? 'block' : 'hidden'} xl:block`}>
          <CartPanel
            storeId={storeId}
            method={method}
            onMethod={(value) => {
              setMethod(value)
              checkout.clearError()
            }}
            customer={customer}
            onCustomer={setCustomer}
            onAddCustomer={(name) => setAddingCustomer(name)}
            lines={cart.lines}
            cash={cash}
            discount={discount}
            onCash={setCash}
            onDiscount={setDiscount}
            totals={totals}
            locked={locked}
            pending={checkout.pending}
            error={checkout.attempt ? null : checkout.error}
            onClear={requestClear}
            onRefresh={() => void refreshCart()}
            onQuantity={(id, delta) => dispatch({ type: 'quantity', id, delta })}
            onReview={() => {
              if (!locked && totals.valid) {
                checkout.clearError()
                setReviewOpen(true)
              }
            }}
          />
        </div>
      </div>
      {barcodeOpen && (
        <BarcodeDialog
          storeId={storeId}
          onMatch={(product) => dispatch({ type: 'add', product })}
          onClose={() => setBarcodeOpen(false)}
        />
      )}
      {clearing && (
        <ClearOrderDialog
          onCancel={() => setClearing(false)}
          onConfirm={() => {
            clear()
            checkout.clearError()
          }}
        />
      )}
      {reviewOpen && (
        <CheckoutConfirmationDialog
          method={method}
          customer={customer}
          lines={cart.lines}
          totals={totals}
          pending={checkout.pending}
          onCancel={cancelReview}
          onConfirm={() => void confirmSale()}
        />
      )}
      {addingCustomer !== null && (
        <CustomerFormDialog
          storeId={storeId}
          initialName={addingCustomer}
          onCreated={(value) => {
            setCustomer(value)
            setAddingCustomer(null)
          }}
          onClose={() => setAddingCustomer(null)}
        />
      )}
      {checkout.receipt && !reviewOpen && (
        <SaleSummaryDialog
          sale={checkout.receipt}
          title="Sale complete"
          onClose={checkout.closeReceipt}
        />
      )}
    </>
  )
}
