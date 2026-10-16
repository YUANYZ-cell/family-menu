import { ArrowLeft, Check } from 'lucide-react'
import type { Ingredient, PantryState } from '../../domain/types'
import { Button } from '../../components/ui/Button'

export function PantryEditor({ ingredients, pantry, onToggle, onClose }: { ingredients: Ingredient[]; pantry: PantryState[]; onToggle: (id: string, available: boolean) => void; onClose: () => void }) {
  const active = new Map(pantry.map((item) => [item.ingredientId, item.available]))
  const dailyIngredientIds = new Set(ingredients.filter((item) => item.enabled && !item.isStaple).map((item) => item.id))
  const selectedCount = pantry.filter((item) => item.available && dailyIngredientIds.has(item.ingredientId)).length
  const groups = ingredients.filter((item) => item.enabled && !item.isStaple).reduce((map, item) => {
    map.set(item.category, [...(map.get(item.category) ?? []), item])
    return map
  }, new Map<string, Ingredient[]>())
  return (
    <section className="page subpage">
      <button className="back-link" type="button" onClick={onClose}><ArrowLeft /> 返回</button>
      <div className="page-heading"><div><h1>家里有什么？</h1><p>点一下切换“有”或“没有”，常备调料不用每天维护。</p></div><p className="summary-count">已选 {selectedCount} 种</p></div>
      {[...groups.entries()].map(([category, items]) => (
        <section key={category} className="ingredient-section"><h2>{category}</h2><div className="ingredient-grid">
          {items.map((item) => { const selected=active.get(item.id) ?? false; return <button key={item.id} type="button" aria-pressed={selected} onClick={() => onToggle(item.id,!selected)}><span>{item.name}</span><span>{selected ? <><Check size={18}/> 有</> : '没有'}</span></button> })}
        </div></section>
      ))}
      <Button variant="primary" onClick={onClose}>选好了，返回</Button>
    </section>
  )
}
