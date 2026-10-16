export const DEFAULT_MENU_WEIGHT_CONFIG = {
  baseScore: 5,
  preference: { LIKE: 2.2, NORMAL: 0, DISLIKE: -2.2, AVOID: -4.2 },
  ingredientComplete: 2.4,
  ingredientOneMissing: -2.8,
  recent: { yesterday: -3.2, twoToThreeDays: -1.7, fourToSixDays: -0.7 },
  temperature: 1.6,
  minScore: -8,
  maxScore: 12,
  repeatedIngredientMultiplier: 0.48,
  repeatedProteinMultiplier: 0.6,
  plantBalanceMultiplier: 1.25,
} as const

export type MenuWeightConfig = typeof DEFAULT_MENU_WEIGHT_CONFIG
