import { Minus, Plus } from 'lucide-react'

export function PeopleStepper({ label, value, min = 0, max = 20, onChange, ariaLabel }: { label: string; value: number; min?: number; max?: number; onChange: (value: number) => void; ariaLabel: string }) {
  return (
    <div className="stepper" aria-label={ariaLabel}>
      <span className="stepper__label">{label}</span>
      <button type="button" aria-label={`减少${label}`} disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))}><Minus aria-hidden="true" /></button>
      <strong>{value}</strong>
      <button type="button" aria-label={`增加${label}`} disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))}><Plus aria-hidden="true" /></button>
    </div>
  )
}
