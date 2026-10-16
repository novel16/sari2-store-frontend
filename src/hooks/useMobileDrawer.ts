import { useEffect, useRef, useState } from 'react'

export function useMobileDrawer() {
  const [isOpen, setIsOpen] = useState(false)
  const drawerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const desktop = window.matchMedia('(min-width: 1024px)')
    if (desktop.matches) return

    const previouslyFocused = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusable = () =>
      Array.from(
        drawerRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex="0"]',
        ) ?? [],
      ).filter((item) => item.getBoundingClientRect().width > 0)

    focusable()[0]?.focus()
    const onResize = () => {
      if (desktop.matches) setIsOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
      if (event.key !== 'Tab') return

      const elements = focusable()
      const first = elements[0]
      const last = elements[elements.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }

    desktop.addEventListener('change', onResize)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      desktop.removeEventListener('change', onResize)
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus()
    }
  }, [isOpen])

  return { isOpen, setIsOpen, drawerRef }
}
