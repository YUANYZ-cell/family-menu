import { describe, expect, it } from 'vitest'
import type { Dish, Ingredient, MealRecord, Member, Preference } from '../../domain/types'
import { generateMenu } from './generateMenu'
import { replaceDish } from './replaceDish'
import { scoreDish } from './scoreDish'

const ingredients: Ingredient[] = [
  ['pork', '猪肉', '肉类'], ['beef', '牛肉', '肉类'], ['fish', '鱼', '肉类'],
  ['egg', '鸡蛋', '其他'], ['tomato', '番茄', '蔬菜'], ['greens', '青菜', '蔬菜'],
  ['cucumber', '黄瓜', '蔬菜'], ['tofu', '豆腐', '其他'], ['winter', '冬瓜', '蔬菜'],
].map(([id, name, category]) => ({ id, name, category, isStaple: false, usageCount: 0, enabled: true, createdAt: 1 }))

const dishes: Dish[] = [
  ['pork-braise', '红烧肉', 'HOT', ['pork'], 'PORK'],
  ['pork-pepper', '青椒肉丝', 'HOT', ['pork', 'greens'], 'PORK'],
  ['beef-tomato', '番茄牛肉', 'HOT', ['beef', 'tomato'], 'BEEF'],
  ['fish-steam', '清蒸鱼', 'HOT', ['fish'], 'FISH'],
  ['tomato-egg', '番茄炒蛋', 'HOT', ['tomato', 'egg'], 'EGG'],
  ['greens', '清炒青菜', 'HOT', ['greens'], 'PLANT'],
  ['tofu', '家常豆腐', 'HOT', ['tofu'], 'PLANT'],
  ['cucumber-cold', '凉拌黄瓜', 'COLD', ['cucumber'], 'PLANT'],
  ['tofu-cold', '小葱拌豆腐', 'COLD', ['tofu'], 'PLANT'],
  ['tomato-cold', '糖拌番茄', 'COLD', ['tomato'], 'PLANT'],
  ['winter-soup', '冬瓜汤', 'SOUP', ['winter'], 'PLANT'],
  ['fish-soup', '鱼头豆腐汤', 'SOUP', ['fish', 'tofu'], 'FISH'],
].map(([id, name, type, requiredIngredientIds, proteinGroup]) => ({
  id: id as string, name: name as string, type: type as Dish['type'],
  requiredIngredientIds: requiredIngredientIds as string[], proteinGroup: proteinGroup as Dish['proteinGroup'],
  enabled: true, createdAt: 1,
}))

const members: Member[] = [{ id: 'm1', name: '爷爷', avatarSeed: '爷', enabled: true, createdAt: 1 }]
const allAvailable = new Set(ingredients.map((item) => item.id))
const base = {
  dishes, ingredients, members, preferences: [] as Preference[], mealRecords: [] as MealRecord[],
  selectedMemberIds: ['m1'], availableIngredientIds: allAvailable,
  configuration: { peopleCount: 4, hotCount: 4, coldCount: 2, soupCount: 1 },
  generatedMenuKeys: [] as string[], now: new Date('2026-09-05T18:00:00+08:00'), rng: () => 0.42,
}

describe('menu engine', () => {
  it('returns the exact requested counts for every dish type', () => {
    const result = generateMenu(base)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.menu.dishes.filter((dish) => dish.type === 'HOT')).toHaveLength(4)
    expect(result.menu.dishes.filter((dish) => dish.type === 'COLD')).toHaveLength(2)
    expect(result.menu.dishes.filter((dish) => dish.type === 'SOUP')).toHaveLength(1)
  })

  it('only returns dishes that the selected cook has registered', () => {
    const result = generateMenu({ ...base, allowedDishIds: new Set(['tomato-egg']), configuration: { ...base.configuration, hotCount: 1, coldCount: 0, soupCount: 0 } })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.menu.dishes.map((dish) => dish.id)).toEqual(['tomato-egg'])
  })

  it('ranks shared preference levels LIKE above NORMAL above DISLIKE above AVOID while keeping all positive', () => {
    const target = dishes[0]
    const values = (['LIKE', 'NORMAL', 'DISLIKE', 'AVOID'] as const).map((level) => scoreDish(target, {
      ...base,
      preferences: level === 'NORMAL' ? [] : [{ id: level, memberId: 'm1', targetType: 'DISH', targetId: target.id, level }],
    }).weight)
    expect(values[0]).toBeGreaterThan(values[1])
    expect(values[1]).toBeGreaterThan(values[2])
    expect(values[2]).toBeGreaterThan(values[3])
    expect(values[3]).toBeGreaterThan(0)
  })

  it('prefers complete ingredients, allows one missing as fallback, and excludes two missing', () => {
    const complete = scoreDish(dishes[2], { ...base, availableIngredientIds: new Set(['beef', 'tomato']) })
    const oneMissing = scoreDish(dishes[2], { ...base, availableIngredientIds: new Set(['beef']) })
    const twoMissing = scoreDish(dishes[2], { ...base, availableIngredientIds: new Set() })
    expect(complete.weight).toBeGreaterThan(oneMissing.weight)
    expect(oneMissing.eligible).toBe(true)
    expect(twoMissing.eligible).toBe(false)
  })

  it('excludes dishes confirmed today and only lowers yesterday dishes', () => {
    const eaten = dishes[0]
    const today = generateMenu({ ...base, configuration: { ...base.configuration, hotCount: 1, coldCount: 0, soupCount: 0 }, mealRecords: [record('2026-09-05', eaten.id)] })
    expect(today.ok && today.menu.dishes.some((dish) => dish.id === eaten.id)).toBe(false)
    const normal = scoreDish(eaten, base).weight
    const yesterday = scoreDish(eaten, { ...base, mealRecords: [record('2026-09-04', eaten.id)] }).weight
    const lastWeek = scoreDish(eaten, { ...base, mealRecords: [record('2026-08-28', eaten.id)] }).weight
    expect(yesterday).toBeLessThan(normal)
    expect(lastWeek).toBe(normal)
  })

  it('does not return a menu combination already shown in the current session', () => {
    const first = generateMenu(base)
    expect(first.ok).toBe(true)
    if (!first.ok) return
    const second = generateMenu({ ...base, rng: () => 0.73, generatedMenuKeys: [first.menu.key] })
    expect(second.ok).toBe(true)
    if (!second.ok) return
    expect(second.menu.key).not.toBe(first.menu.key)
  })

  it('replaces only the chosen dish with another dish of the same type', () => {
    const menu = [dishes[0], dishes[7], dishes[10]]
    const result = replaceDish({ ...base, currentDishes: menu, dishId: dishes[0].id })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.dishes[1]).toBe(dishes[7])
    expect(result.dishes[2]).toBe(dishes[10])
    expect(result.dishes[0].type).toBe('HOT')
    expect(result.dishes[0].id).not.toBe(dishes[0].id)
  })

  it('does not replace a dish with one the selected cook has not registered', () => {
    const result = replaceDish({ ...base, allowedDishIds: new Set(['pork-braise', 'tomato-egg']), currentDishes: [dishes[0]], dishId: dishes[0].id })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.dishes[0].id).toBe('tomato-egg')
  })

  it('reports a typed shortage instead of filling a missing cold dish with another type', () => {
    const result = generateMenu({
      ...base,
      dishes: dishes.filter((dish) => dish.type !== 'COLD').concat(dishes[7]),
      configuration: { ...base.configuration, hotCount: 1, coldCount: 2, soupCount: 0 },
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.shortage.available).toMatchObject({ HOT: 1, COLD: 1, SOUP: 0 })
    expect(result.shortage.message).toContain('凉菜')
  })

  it('uses variety scoring to avoid an all-pork hot menu when alternatives exist', () => {
    const porkHeavy = dishes.filter((dish) => ['pork-braise', 'pork-pepper', 'fish-steam', 'greens'].includes(dish.id))
    const result = generateMenu({ ...base, dishes: porkHeavy, configuration: { ...base.configuration, hotCount: 3, coldCount: 0, soupCount: 0 } })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(new Set(result.menu.dishes.map((dish) => dish.proteinGroup)).size).toBeGreaterThan(1)
  })
})

function record(mealDate: string, dishId: string): MealRecord {
  return { id: `${mealDate}-${dishId}`, mealDate, mealType: 'DINNER', memberIds: ['m1'], peopleCount: 1, guestCount: 0, dishIds: [dishId], dishNames: [], confirmedAt: `${mealDate}T18:00:00+08:00` }
}
