export function requiredName(value: string, label: string) {
  const name = value.trim()
  if (!name) throw new Error(`请填写${label}。`)
  if (name.length > 20) throw new Error(`${label}请控制在 20 个字以内。`)
  return name
}
