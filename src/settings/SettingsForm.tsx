import type { FormEvent, ReactNode } from 'react'
import { useRef } from 'react'
import FormError from '../auth/components/FormError'
import { useMutation } from '../hooks/useMutation'

export default function SettingsForm({
  title,
  description,
  children,
  save,
  onBusy,
  onSaved,
}: {
  title: string
  description: string
  children: ReactNode
  save: (data: FormData) => Promise<void>
  onBusy: (value: boolean) => void
  onSaved: () => void
}) {
  const mutation = useMutation()
  const submitting = useRef(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting.current) return
    submitting.current = true
    const form = event.currentTarget
    const data = new FormData(form)
    onBusy(true)
    const success = await mutation.run(() => save(data))
    submitting.current = false
    onBusy(false)
    if (success) {
      for (const input of form.querySelectorAll<HTMLInputElement>('input[type=password]'))
        input.value = ''
      onSaved()
    }
  }
  return (
    <section className="panel min-w-0 p-5 sm:p-7">
      <h2 className="mb-2 text-base font-semibold">{title}</h2>
      <p className="mb-6 text-xs leading-relaxed text-stone-500">{description}</p>
      <form onSubmit={(event) => void submit(event)} aria-busy={mutation.pending}>
        <FormError error={mutation.error} />
        {Object.entries(mutation.fields).map(([name, messages]) => (
          <p key={name} role="alert" className="mb-2 text-xs text-red-700">
            {messages[0]}
          </p>
        ))}
        <fieldset disabled={mutation.pending} className="space-y-5">
          {children}
          <div className="form-actions">
            <button className="btn btn-primary" type="submit">
              {mutation.pending ? 'Saving…' : `Save ${title.toLowerCase()}`}
            </button>
          </div>
        </fieldset>
      </form>
    </section>
  )
}
