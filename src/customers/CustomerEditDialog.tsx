import type { FormEvent } from 'react'
import { Modal } from '../components/ui'
import FormError from '../auth/components/FormError'
import { useMutation } from '../hooks/useMutation'
import { customersApi } from './api'
import type { Customer } from './types'

export default function CustomerEditDialog({
  storeId,
  customer,
  onClose,
  onSaved,
}: {
  storeId: number
  customer: Customer
  onClose: () => void
  onSaved: () => void
}) {
  const mutation = useMutation()
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    if (
      await mutation.run(() =>
        customersApi.update(storeId, customer.id, {
          name: String(data.get('name')).trim(),
          phone: String(data.get('phone')).trim() || null,
          notes: String(data.get('notes')).trim() || null,
        }),
      )
    )
      onSaved()
  }
  return (
    <Modal title="Edit customer" dismissible={!mutation.pending} onClose={onClose}>
      <p className="mb-5 text-xs text-stone-500">
        Update contact details. Saved sales and payment slips keep their original customer details.
      </p>
      <form onSubmit={(event) => void submit(event)}>
        <FormError error={mutation.error} />
        <fieldset disabled={mutation.pending} className="space-y-4">
          <label className="field">
            <span>Customer name</span>
            <input
              name="name"
              data-autofocus
              required
              maxLength={120}
              defaultValue={customer.name}
            />
            {mutation.fields.name?.[0] && (
              <small className="text-red-700">{mutation.fields.name[0]}</small>
            )}
          </label>
          <label className="field">
            <span>Phone number (optional)</span>
            <input name="phone" type="tel" maxLength={30} defaultValue={customer.phone ?? ''} />
            {mutation.fields.phone?.[0] && (
              <small className="text-red-700">{mutation.fields.phone[0]}</small>
            )}
          </label>
          <label className="field">
            <span>Notes (optional)</span>
            <textarea name="notes" maxLength={500} defaultValue={customer.notes ?? ''} />
            {mutation.fields.notes?.[0] && (
              <small className="text-red-700">{mutation.fields.notes[0]}</small>
            )}
          </label>
        </fieldset>
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={mutation.pending}
            onClick={onClose}
          >
            Cancel
          </button>
          <button className="btn btn-primary" disabled={mutation.pending}>
            {mutation.pending ? 'Saving…' : 'Save customer details'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
