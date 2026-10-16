import { useState } from 'react'
import { ArrowLeft, Check, CookingPot } from 'lucide-react'
import type { Cook, Dish, DishType } from '../../domain/types'
import { Button } from '../../components/ui/Button'
import { useFamilyData } from '../today/useFamilyData'
import '../dishes/management.css'
import './cooks.css'

const dishTypes: Array<{ type: DishType; label: string }> = [
  { type: 'HOT', label: '热菜' },
  { type: 'COLD', label: '凉菜' },
  { type: 'SOUP', label: '汤' },
]

export function CooksPage() {
  const { snapshot, error } = useFamilyData()
  const [activeCookId, setActiveCookId] = useState<string | null>(null)

  if (error) return <section className="page"><div className="error-panel">{error}</div></section>
  if (!snapshot) return <section className="page loading"><h1>正在打开做菜人设置…</h1></section>

  const activeCook = snapshot.cooks.find((item) => item.id === activeCookId)
  if (activeCook) return <CookDishEditor cook={activeCook} dishes={snapshot.dishes} assignedDishIds={new Set(snapshot.cookDishes.filter((item) => item.cookId === activeCook.id && snapshot.dishes.some((dish) => dish.id === item.dishId && dish.enabled)).map((item) => item.dishId))} onBack={() => setActiveCookId(null)} />

  return (
    <section className="page management-page">
      <div className="management-heading">
        <div><h1>做菜人</h1><p>这里只有外婆和爸爸。登记各自会做的菜后，随机菜单会严格按这份清单筛选。</p></div>
      </div>
      <div className="cook-management-grid">
        {snapshot.cooks.map((cook) => {
          const count = snapshot.cookDishes.filter((item) => item.cookId === cook.id && snapshot.dishes.some((dish) => dish.id === item.dishId && dish.enabled)).length
          return (
            <article key={cook.id}>
              <span className="large-avatar">{cook.avatarSeed}</span>
              <div><h2>{cook.name}</h2><p>已登记会做 {count} 道菜</p></div>
              <Button aria-label={`登记${cook.name}会做的菜`} onClick={() => setActiveCookId(cook.id)}><CookingPot /> 登记会做的菜</Button>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function CookDishEditor({ cook, dishes, assignedDishIds, onBack }: { cook: Cook; dishes: Dish[]; assignedDishIds: Set<string>; onBack: () => void }) {
  const { repository, refresh } = useFamilyData()
  const [message, setMessage] = useState('')
  const enabledDishes = dishes.filter((item) => item.enabled)

  const toggleDish = async (dish: Dish) => {
    const canCook = !assignedDishIds.has(dish.id)
    await repository.setCookDish(cook.id, dish.id, canCook)
    await refresh()
    setMessage(canCook ? `已登记：${cook.name}会做${dish.name}。` : `已取消：${cook.name}会做${dish.name}。`)
  }

  return (
    <section className="page cook-editor">
      <button className="back-link" type="button" onClick={onBack}><ArrowLeft /> 返回做菜人</button>
      <div className="management-heading">
        <div><h1>{cook.name}会做什么菜？</h1><p>点一下登记，再点一次取消。选择{cook.name}做饭时，只会随机这里勾选过的菜。</p></div>
      </div>
      {message && <div className="page-message" role="status">{message}</div>}
      <p className="cook-editor__count">已登记 <strong>{assignedDishIds.size}</strong> 道菜</p>
      {dishTypes.map(({ type, label }) => {
        const dishesOfType = enabledDishes.filter((dish) => dish.type === type)
        if (!dishesOfType.length) return null
        return (
          <section key={type} className="cook-dish-section">
            <h2>{label}</h2>
            <div className="choice-grid choice-grid--large">
              {dishesOfType.map((dish) => {
                const selected = assignedDishIds.has(dish.id)
                return <button key={dish.id} type="button" aria-label={`把${dish.name}设为${cook.name}会做`} aria-pressed={selected} onClick={() => void toggleDish(dish)}>{selected && <Check size={18} />} {dish.name}</button>
              })}
            </div>
          </section>
        )
      })}
      {!enabledDishes.length && <div className="empty-state">还没有可登记的菜，先去“菜品”添加吧。</div>}
    </section>
  )
}
