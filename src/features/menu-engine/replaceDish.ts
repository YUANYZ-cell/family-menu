import { scoreDish } from './scoreDish'
import type { ReplaceDishInput, ReplaceDishResult } from './types'
import { weightedPick } from './weightedRandom'

export function replaceDish(input: ReplaceDishInput): ReplaceDishResult {
  const index = input.currentDishes.findIndex((dish) => dish.id === input.dishId)
  if (index < 0) return { ok: false, message: '没有找到要更换的菜。' }
  const old = input.currentDishes[index]
  const used = new Set(input.currentDishes.map((dish) => dish.id))
  const candidates = input.dishes.filter((dish) => !input.allowedDishIds || input.allowedDishIds.has(dish.id)).map((dish) => scoreDish(dish, input)).filter((item) => item.eligible && item.dish.type === old.type && !used.has(item.dish.id))
  const complete = candidates.filter((item) => item.missingIngredientIds.length === 0)
  const pool = complete.length ? complete : candidates
  const chosen = weightedPick(pool, (item) => item.weight, input.rng ?? Math.random)
  if (!chosen) return { ok: false, message: `暂时没有其他${old.type === 'HOT' ? '热菜' : old.type === 'COLD' ? '凉菜' : '汤'}可以换。` }
  const dishes = [...input.currentDishes]
  dishes[index] = chosen.dish
  const missingIngredients = chosen.missingIngredientIds.map((id) => input.ingredients.find((item) => item.id === id)?.name).filter(Boolean) as string[]
  return { ok: true, dishes, missingIngredients }
}
