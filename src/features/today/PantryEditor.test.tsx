import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Ingredient, PantryState } from '../../domain/types'
import { PantryEditor } from './PantryEditor'

describe('PantryEditor', () => {
  it('counts only daily-maintained major ingredients, not always-available staples', () => {
    const ingredients: Ingredient[] = [
      { id:'rice',name:'米',category:'常备',isStaple:true,usageCount:0,enabled:true,createdAt:1 },
      { id:'fish',name:'鱼',category:'水产',isStaple:false,usageCount:1,enabled:true,createdAt:2 },
    ]
    const pantry: PantryState[] = [
      { ingredientId:'rice',available:true,updatedAt:1 },
      { ingredientId:'fish',available:true,updatedAt:1 },
    ]
    render(<PantryEditor ingredients={ingredients} pantry={pantry} onToggle={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByText('已选 1 种')).toBeInTheDocument()
  })
})
