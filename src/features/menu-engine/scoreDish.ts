import type { Dish } from '../../domain/types'
import { DEFAULT_MENU_WEIGHT_CONFIG } from './config'
import type { DishScore, ScoreContext } from './types'

const prefValue = { LIKE: 2.2, DISLIKE: -2.2, AVOID: -4.2 } as const

export function scoreDish(dish: Dish, context: ScoreContext): DishScore {
  const config = context.config ?? DEFAULT_MENU_WEIGHT_CONFIG
  const missingIngredientIds = dish.requiredIngredientIds.filter((id) => !context.availableIngredientIds.has(id))
  if (!dish.enabled || missingIngredientIds.length > 1 || eatenToday(dish.id, context)) {
    return { dish, score: config.minScore, weight: 0, eligible: false, missingIngredientIds }
  }
  let score = config.baseScore + (missingIngredientIds.length ? config.ingredientOneMissing : config.ingredientComplete)
  const selected = new Set(context.selectedMemberIds)
  let likes = 0
  let negative = 0
  for (const preference of context.preferences) {
    if (!selected.has(preference.memberId)) continue
    const applies = preference.targetType === 'DISH'
      ? preference.targetId === dish.id
      : dish.requiredIngredientIds.includes(preference.targetId)
    if (!applies) continue
    const configured = config.preference[preference.level]
    score += configured ?? prefValue[preference.level]
    if (preference.level === 'LIKE') likes++
    else negative++
  }
  if (likes >= 2) score += Math.min(1.5, likes * 0.35)
  if (negative >= 2) score -= Math.min(1.5, negative * 0.4)
  score += recentPenalty(dish.id, context)
  score = Math.max(config.minScore, Math.min(config.maxScore, score))
  return { dish, score, weight: Math.exp(score / config.temperature), eligible: true, missingIngredientIds }
}

function eatenToday(dishId: string, context: ScoreContext) {
  const today = localDate(context.now)
  return context.mealRecords.some((record) => record.mealDate === today && record.dishIds.includes(dishId))
}

function recentPenalty(dishId: string, context: ScoreContext) {
  const config = context.config ?? DEFAULT_MENU_WEIGHT_CONFIG
  const today = startOfDay(context.now).getTime()
  let closest = Number.POSITIVE_INFINITY
  for (const record of context.mealRecords) {
    if (!record.dishIds.includes(dishId)) continue
    const day = new Date(`${record.mealDate}T00:00:00`).getTime()
    closest = Math.min(closest, Math.round((today - day) / 86_400_000))
  }
  if (closest === 1) return config.recent.yesterday
  if (closest >= 2 && closest <= 3) return config.recent.twoToThreeDays
  if (closest >= 4 && closest <= 6) return config.recent.fourToSixDays
  return 0
}

function localDate(date: Date) {
  const y = date.getFullYear()
  return `${y}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
}

function startOfDay(date: Date) { return new Date(date.getFullYear(), date.getMonth(), date.getDate()) }
