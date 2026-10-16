import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { Modal } from '../components/ui'
import FormError from '../auth/components/FormError'
import { useMutation } from '../hooks/useMutation'
import { customersApi } from './api'
import type { Customer, CustomerInput } from './types'

export default function CustomerFormDialog({
  storeId,
  initialName = '',
  onCreated,
  onClose,
}: {
  storeId: number
  initialName?: string
  onCreated: (customer: Customer) => void
  onClose: () => void
}) {
  const [name, setName] = useState(initialName)
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [attempt, setAttempt] = useState<CustomerInput | null>(null)
  const submitting = useRef(false)
  const mutation = useMutation()
  const uncertain = Boolean(
    attempt && mutation.error && ![404, 409, 422].includes(mutation.error.status ?? 0),
  )

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting.current) return
    submitting.current = true
    const input =
      uncertain && attempt
        ? attempt
        : {
            request_key: crypto.randomUUID(),
            name: name.trim(),
            phone: phone.trim() || null,
            notes: notes.trim() || null,
          }
    setAttempt(input)
    try {
      await mutation.run(async () => onCreated((await customersApi.create(storeId, input)).data))
    } finally {
      submitting.current = false
    }
  }
  return (
    <Modal
      title="Add a customer"
      dismissible={!mutation.pending}
      onClose={() => {
        if (!submitting.current) onClose()
      }}
    >
      <p className="mb-5 text-xs leading-relaxed text-stone-500">
        Save your customer's name for utang. New customers start with a zero balance.
      </p>
      <form onSubmit={(event) => void submit(event)}>
        <FormError error={mutation.error} />
        <fieldset disabled={mutation.pending || uncertain} className="space-y-4">
          <label className="field">
            <span>Customer name *</span>
            <input
              name="customer_name"
              data-autofocus
              required
              maxLength={120}
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Aling Linda"
            />
            {mutation.fields.name?.[0] && (
              <small className="text-red-700">{mutation.fields.name[0]}</small>
            )}
          </label>
          <label className="field">
            <span>Phone number (optional)</span>
            <input
              name="customer_phone"
              type="tel"
              maxLength={30}
              autoComplete="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="09XX XXX XXXX"
            />
            {mutation.fields.phone?.[0] && (
              <small className="text-red-700">{mutation.fields.phone[0]}</small>
            )}
          </label>
          <label className="field">
            <span>Notes (optional)</span>
            <textarea
              name="customer_notes"
              maxLength={500}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="A reminder to help identify your customer"
            />
          </label>
        </fieldset>
        {uncertain && (
          <p className="mt-4 text-xs text-amber-800">
            This customer may already be saved. Retry the same request to confirm it.
          </p>
        )}
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={mutation.pending}
            onClick={onClose}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={mutation.pending}>
            <Plus size={15} />
            {mutation.pending
              ? 'Saving customer…'
              : uncertain
                ? 'Retry saving customer'
                : 'Save customer'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
