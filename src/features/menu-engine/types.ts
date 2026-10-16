import type { Dish, FamilySnapshot, Ingredient, MealConfiguration, MealRecord, Member, Preference } from '../../domain/types'
import type { MenuWeightConfig } from './config'

export interface MenuGenerationInput {
  dishes: Dish[]; ingredients: Ingredient[]; members: Member[]; preferences: Preference[]; mealRecords: MealRecord[]
  allowedDishIds?: Set<string>
  selectedMemberIds: string[]; availableIngredientIds: Set<string>; configuration: MealConfiguration
  generatedMenuKeys: string[]; now: Date; rng?: () => number; config?: MenuWeightConfig
}

export interface DishScore { dish: Dish; score: number; weight: number; eligible: boolean; missingIngredientIds: string[] }
export interface GeneratedMenu { dishes: Dish[]; missingIngredients: Record<string, string[]>; key: string }
export type MenuGenerationResult = { ok: true; menu: GeneratedMenu } | { ok: false; shortage: { requested: Record<'HOT'|'COLD'|'SOUP',number>; available: Record<'HOT'|'COLD'|'SOUP',number>; missingIngredients: string[]; message: string } }
export type ReplaceDishInput = MenuGenerationInput & { currentDishes: Dish[]; dishId: string }
export type ReplaceDishResult = { ok: true; dishes: Dish[]; missingIngredients: string[] } | { ok: false; message: string }

export type ScoreContext = Pick<MenuGenerationInput, 'ingredients'|'members'|'preferences'|'mealRecords'|'selectedMemberIds'|'availableIngredientIds'|'now'|'config'>
export type FamilyDataInput = FamilySnapshot
