import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'

export function Modal({
  title,
  children,
  onClose,
  wide = false,
  dismissible = true,
}: {
  title: string
  children: ReactNode
  onClose: () => void
  wide?: boolean
  dismissible?: boolean
}) {
  const headingId = useId()
  const closeRef = useRef(onClose)
  useEffect(() => {
    closeRef.current = () => {
      if (dismissible) onClose()
    }
  }, [onClose, dismissible])
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const dialog = document.querySelector<HTMLElement>(`[aria-labelledby="${headingId}"]`)
    const focusable = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex="0"]',
        ) ?? [],
      ).filter((element) => element.getBoundingClientRect().width > 0)
    const initialFocus = dialog?.querySelector<HTMLElement>('[data-autofocus]') ?? focusable()[0]
    initialFocus?.focus()
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeRef.current()
      if (event.key === 'Tab') {
        const elements = focusable()
        if (!elements.length) {
          event.preventDefault()
          dialog?.focus()
          return
        }
        const first = elements[0]
        const last = elements[elements.length - 1]
        if (!dialog?.contains(document.activeElement)) {
          event.preventDefault()
          first?.focus()
        } else if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }
    }
    document.addEventListener('keydown', handler)
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = previousOverflow
      previous?.focus()
    }
  }, [headingId])
  return (
    <div className="modal-backdrop" onClick={() => dismissible && onClose()}>
      <section
        className={`modal${wide ? ' modal-wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-heading">
          <h2 id={headingId}>{title}</h2>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            disabled={!dismissible}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </section>
    </div>
  )
}
