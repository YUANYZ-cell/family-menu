import { Check, ChefHat } from 'lucide-react'
import type { Cook } from '../../domain/types'

export function CookSelector({ cooks, selectedCookId, dishCounts, onSelect }: { cooks: Cook[]; selectedCookId: string; dishCounts: Record<string, number>; onSelect: (id: string) => void }) {
  return <div className="cook-grid">{cooks.map((cook) => {
    const selected = selectedCookId === cook.id
    return <button key={cook.id} type="button" className="cook-choice" aria-label={`选择${cook.name}做菜`} aria-pressed={selected} onClick={() => onSelect(cook.id)}><span className="cook-choice__avatar">{selected ? <Check aria-hidden="true" /> : <ChefHat aria-hidden="true" />}</span><span><strong>{cook.name}做菜</strong><small>已登记会做 {dishCounts[cook.id] ?? 0} 道</small></span></button>
  })}</div>
}
