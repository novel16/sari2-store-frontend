import { useRef } from 'react'
import type { FormEvent } from 'react'
import { Modal, ProductArt } from '../../components/ui'
import { FormField } from '../../components/ui/FormField'
import { fieldAttributes } from '../../components/ui/fieldAttributes'
import FormError from '../../auth/components/FormError'
import { catalogApi } from '../../catalog/api'
import type { AdjustmentInput, Product } from '../../catalog/types'
import { useMutation } from '../../hooks/useMutation'

type Props = {
  storeId: number
  adjusting: Product
  onClose: () => void
  onSaved: () => void
  onReload: () => void
}

export default function StockAdjustmentDialog({
  storeId,
  adjusting,
  onClose,
  onSaved,
  onReload,
}: Props) {
  const { pending, error, fields, run } = useMutation()
  const lastAttempt = useRef<{ signature: string; key: string } | null>(null)
  async function adjust(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const mode = String(data.get('mode')) as AdjustmentInput['mode']
    const input = {
      product_id: adjusting.id,
      mode,
      quantity: Number(data.get('quantity')),
      reason: String(data.get('reason')).trim(),
      ...(mode === 'set' ? { expected_version: adjusting.inventory.version } : {}),
    }
    const signature = JSON.stringify(input)
    if (lastAttempt.current?.signature !== signature)
      lastAttempt.current = { signature, key: crypto.randomUUID() }
    if (
      await run(() =>
        catalogApi.adjustStock(storeId, { ...input, request_key: lastAttempt.current!.key }),
      )
    )
      onSaved()
  }
  return (
    <Modal
      title="Adjust stock"
      onClose={() => {
        if (!pending) onClose()
      }}
    >
      <div className="mb-6 flex items-center gap-3 rounded-xl bg-paper p-4">
        <ProductArt product={adjusting} small />
        <div>
          <strong className="text-xs">{adjusting.name}</strong>
          <p className="mt-1 text-[11px] text-stone-500">
            Currently {adjusting.inventory.quantity_on_hand} {adjusting.unit}(s) on hand
          </p>
        </div>
      </div>
      <form onSubmit={(event) => void adjust(event)} aria-busy={pending}>
        <FormError error={error} />
        {error && !error.status && (
          <p className="mb-4 text-xs text-stone-600">
            Retry with the same details to safely confirm this adjustment.
          </p>
        )}
        <fieldset className="form-grid" disabled={pending}>
          <FormField label="Adjustment type" name="mode" errors={fields.mode}>
            <select {...fieldAttributes('mode', fields.mode)}>
              <option value="add">Add stock</option>
              <option value="remove">Remove stock</option>
              <option value="set">Set counted stock</option>
            </select>
          </FormField>
          <FormField label="Quantity" name="quantity" errors={fields.quantity}>
            <input
              {...fieldAttributes('quantity', fields.quantity)}
              type="number"
              min="0"
              max="1000000000"
              step="1"
              required
              defaultValue="1"
            />
          </FormField>
          <FormField label="Reason" name="reason" errors={fields.reason} wide>
            <input
              {...fieldAttributes('reason', fields.reason)}
              required
              maxLength={255}
              list="stock-reasons"
              placeholder="e.g. New delivery or physical stock count"
            />
            <datalist id="stock-reasons">
              <option value="New delivery" />
              <option value="Physical stock count" />
              <option value="Damaged or expired" />
              <option value="Correction" />
            </datalist>
          </FormField>
        </fieldset>
        <p className="mt-4 text-[11px] leading-relaxed text-stone-500">
          Every change is saved with your name, reason, and time. Counted stock requires a fresh
          inventory view.
        </p>
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" disabled={pending} onClick={onClose}>
            Cancel
          </button>
          {error?.status === 409 && (
            <button type="button" className="btn btn-secondary" onClick={onReload}>
              Reload stock
            </button>
          )}
          <button className="btn btn-primary" type="submit" disabled={pending}>
            {pending ? 'Saving…' : 'Save adjustment'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
