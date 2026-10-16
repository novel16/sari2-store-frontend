export function clearPasswordConfirmation(form: HTMLFormElement) {
  const confirmation = form.elements.namedItem('password_confirmation')
  if (confirmation instanceof HTMLInputElement) confirmation.setCustomValidity('')
}

export function validatePasswordLength(form: HTMLFormElement): boolean {
  for (const name of ['password', 'password_confirmation']) {
    const input = form.elements.namedItem(name)
    if (!(input instanceof HTMLInputElement)) continue
    if (new TextEncoder().encode(input.value).byteLength > 72) {
      input.setCustomValidity(
        'This password is too long. Use a shorter password; emoji and accented letters count toward the 72-byte limit.',
      )
      input.reportValidity()
      return false
    }
  }
  return true
}

export function validatePasswordConfirmation(form: HTMLFormElement): boolean {
  if (!validatePasswordLength(form)) return false
  const data = new FormData(form)
  const confirmation = form.elements.namedItem('password_confirmation')
  if (data.get('password') === data.get('password_confirmation')) return true
  if (confirmation instanceof HTMLInputElement) {
    confirmation.setCustomValidity('Please enter the same password in both fields.')
    confirmation.reportValidity()
  }
  return false
}
