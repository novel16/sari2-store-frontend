import { Modal } from '../components/ui'
import FormError from '../auth/components/FormError'
import { useMutation } from '../hooks/useMutation'
import { money } from '../lib/format'
import { customersApi } from './api'
import type { Customer } from './types'

export default function CustomerStatusDialog({
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
  const mutation = useMutation(),
    archived = customer.status === 'archived'
  async function confirm() {
    if (
      await mutation.run(() =>
        customersApi.status(storeId, customer.id, archived ? 'active' : 'archived'),
      )
    )
      onSaved()
  }
  return (
    <Modal
      title={archived ? 'Restore customer?' : 'Archive customer?'}
      dismissible={!mutation.pending}
      onClose={onClose}
    >
      <p className="text-sm leading-relaxed text-stone-600">
        {archived
          ? `${customer.name} will be available for new utang sales again.`
          : `${customer.name} will leave the active POS picker. Their history and outstanding utang stay available under Archived customers, where you can still record payments.`}
      </p>
      <p className="my-4 text-sm font-semibold">
        Current outstanding: {money(customer.balance_centavos)}
      </p>
      <FormError error={mutation.error} />
      <div className="form-actions">
        <button
          className="btn btn-secondary"
          data-autofocus
          disabled={mutation.pending}
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          className="btn btn-primary"
          disabled={mutation.pending}
          onClick={() => void confirm()}
        >
          {mutation.pending ? 'Saving…' : archived ? 'Restore customer' : 'Archive customer'}
        </button>
      </div>
    </Modal>
  )
}
