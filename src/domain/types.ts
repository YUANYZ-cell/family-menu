export type Id = string
export type DishType = 'HOT' | 'COLD' | 'SOUP'
export type PreferenceLevel = 'LIKE' | 'NORMAL' | 'DISLIKE' | 'AVOID'
export type PreferenceTarget = 'DISH' | 'INGREDIENT'
export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER'
export type ProteinGroup = 'PORK' | 'BEEF' | 'POULTRY' | 'FISH' | 'EGG' | 'PLANT' | 'OTHER'

export interface Member { id: Id; name: string; avatarSeed: string; enabled: boolean; createdAt: number }
export interface Cook { id: Id; name: string; avatarSeed: string; createdAt: number }
export interface CookDish { id: Id; cookId: Id; dishId: Id }
export interface Preference { id: Id; memberId: Id; targetType: PreferenceTarget; targetId: Id; level: Exclude<PreferenceLevel, 'NORMAL'> }
export interface Ingredient { id: Id; name: string; category: string; isStaple: boolean; usageCount: number; enabled: boolean; createdAt: number }
export interface PantryState { ingredientId: Id; available: boolean; updatedAt: number }
export interface Dish { id: Id; name: string; type: DishType; requiredIngredientIds: Id[]; proteinGroup: ProteinGroup; enabled: boolean; createdAt: number }
export interface MealPreset { id: Id; name: string; hotCount: number; coldCount: number; soupCount: number; builtIn: boolean; enabled: boolean; sortOrder: number }
export interface MealRecord { id: Id; mealDate: string; mealType: MealType; memberIds: Id[]; peopleCount: number; guestCount: number; dishIds: Id[]; dishNames: string[]; confirmedAt: string; cookId?: Id }
export interface MealConfiguration { peopleCount: number; hotCount: number; coldCount: number; soupCount: number }

export interface FamilySnapshot {
  members: Member[]
  cooks: Cook[]
  cookDishes: CookDish[]
  preferences: Preference[]
  ingredients: Ingredient[]
  pantry: PantryState[]
  dishes: Dish[]
  presets: MealPreset[]
  mealRecords: MealRecord[]
}
