import type { Dish, DishType } from '../../domain/types'
import { DEFAULT_MENU_WEIGHT_CONFIG } from './config'
import { scoreDish } from './scoreDish'
import type { GeneratedMenu, MenuGenerationInput, MenuGenerationResult } from './types'
import { weightedPick } from './weightedRandom'

const TYPES: DishType[] = ['HOT','COLD','SOUP']

export function generateMenu(input: MenuGenerationInput): MenuGenerationResult {
  const requested = { HOT: input.configuration.hotCount, COLD: input.configuration.coldCount, SOUP: input.configuration.soupCount }
  const scored = input.dishes.filter((dish) => !input.allowedDishIds || input.allowedDishIds.has(dish.id)).map((dish) => scoreDish(dish, input)).filter((item) => item.eligible)
  const pools = Object.fromEntries(TYPES.map((type) => [type, chooseTier(scored.filter((item) => item.dish.type === type), requested[type])])) as Record<DishType, ReturnType<typeof chooseTier>>
  const available = Object.fromEntries(TYPES.map((type) => [type, Math.min(requested[type], pools[type].length)])) as Record<DishType, number>
  const shortType = TYPES.find((type) => pools[type].length < requested[type])
  if (shortType) {
    const names = pools[shortType].flatMap((item) => item.missingIngredientIds).map((id) => input.ingredients.find((item) => item.id === id)?.name).filter(Boolean) as string[]
    return { ok: false, shortage: { requested, available, missingIngredients: [...new Set(names)], message: `现在能选的${typeName(shortType)}有点少，目前只能搭出 ${available[shortType]} 道。` } }
  }

  const rng = input.rng ?? Math.random
  const shown = new Set(input.generatedMenuKeys)
  let fallback: GeneratedMenu | undefined
  for (let attempt = 0; attempt < 36; attempt++) {
    const picked: Dish[] = []
    for (const type of TYPES) picked.push(...pickType(pools[type], requested[type], picked, rng, input))
    const menu = toMenu(picked, input)
    fallback ??= menu
    if (!shown.has(menu.key)) return { ok: true, menu }
  }
  if (fallback && shown.size === 0) return { ok: true, menu: fallback }
  return { ok: false, shortage: { requested, available, missingIngredients: [], message: '这一轮已经看过所有可用搭配了，可以改一下食材或菜品数量。' } }
}

function chooseTier(items: ReturnType<typeof scoreDish>[], count: number) {
  const complete = items.filter((item) => item.missingIngredientIds.length === 0)
  return complete.length >= count ? complete : items
}

function pickType(pool: ReturnType<typeof scoreDish>[], count: number, table: Dish[], rng: () => number, input: MenuGenerationInput) {
  const remaining = [...pool]
  const picked: Dish[] = []
  while (picked.length < count) {
    const chosen = weightedPick(remaining, (item) => contextualWeight(item.dish, item.weight, [...table, ...picked], input), rng)
    if (!chosen) break
    picked.push(chosen.dish)
    remaining.splice(remaining.indexOf(chosen), 1)
  }
  return picked
}

function contextualWeight(dish: Dish, baseWeight: number, current: Dish[], input: MenuGenerationInput) {
  const config = input.config ?? DEFAULT_MENU_WEIGHT_CONFIG
  let multiplier = 1
  const usedIngredients = new Set(current.flatMap((item) => item.requiredIngredientIds))
  const overlap = dish.requiredIngredientIds.filter((id) => usedIngredients.has(id)).length
  if (overlap) multiplier *= Math.pow(config.repeatedIngredientMultiplier, overlap)
  if (current.some((item) => item.proteinGroup === dish.proteinGroup && dish.proteinGroup !== 'PLANT')) multiplier *= config.repeatedProteinMultiplier
  if (dish.proteinGroup === 'PLANT' && current.some((item) => item.proteinGroup !== 'PLANT')) multiplier *= config.plantBalanceMultiplier
  return baseWeight * multiplier
}

function toMenu(dishes: Dish[], input: MenuGenerationInput): GeneratedMenu {
  const missingIngredients: Record<string,string[]> = {}
  for (const dish of dishes) {
    const names = dish.requiredIngredientIds.filter((id) => !input.availableIngredientIds.has(id)).map((id) => input.ingredients.find((item) => item.id === id)?.name).filter(Boolean) as string[]
    if (names.length) missingIngredients[dish.id] = names
  }
  return { dishes, missingIngredients, key: dishes.map((dish) => dish.id).sort().join('|') }
}

function typeName(type: DishType) { return type === 'HOT' ? '热菜' : type === 'COLD' ? '凉菜' : '汤' }
