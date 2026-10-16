import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Dish } from '../../domain/types'
import { MenuResult } from './MenuResult'

const dishes: Dish[] = [
  { id:'a',name:'番茄炒蛋',type:'HOT',requiredIngredientIds:['tomato','egg'],proteinGroup:'EGG',enabled:true,createdAt:1 },
  { id:'b',name:'凉拌黄瓜',type:'COLD',requiredIngredientIds:['cucumber'],proteinGroup:'PLANT',enabled:true,createdAt:2 },
]

describe('MenuResult', () => {
  it('shows every adjustment as a labelled action and exposes missing ingredients', async () => {
    const replace = vi.fn()
    render(<MenuResult dishes={dishes} cookName="外婆" ingredientNames={{tomato:'番茄',egg:'鸡蛋',cucumber:'黄瓜'}} missingIngredients={{a:['鸡蛋']}} peopleCount={3} onReplace={replace} onManualReplace={vi.fn()} onDelete={vi.fn()} onAdd={vi.fn()} onReroll={vi.fn()} onConfirm={vi.fn()} onBack={vi.fn()} />)
    expect(screen.getByText('还需要：鸡蛋')).toBeInTheDocument()
    expect(screen.getByLabelText('外婆下厨')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '换掉番茄炒蛋' }))
    expect(replace).toHaveBeenCalledWith('a')
    expect(screen.getByRole('button', { name: '就吃这些' })).toBeVisible()
  })
})
