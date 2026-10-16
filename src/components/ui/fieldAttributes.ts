export function fieldAttributes(name: string, errors?: string[]) {
  return {
    id: name,
    name,
    'aria-invalid': Boolean(errors?.length),
    'aria-describedby': errors?.length ? `${name}-error` : undefined,
  }
}
