import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FamilyDatabase } from '../../data/db'
import { FamilyDataProvider } from '../today/useFamilyData'
import { DishesPage } from './DishesPage'

const databases: FamilyDatabase[]=[]
afterEach(async()=>{vi.restoreAllMocks();await Promise.all(databases.splice(0).map((db)=>db.delete()))})

describe('DishesPage',()=>{
  it('removes a dish from the active list after it is disabled',async()=>{
    const user=userEvent.setup()
    const db=new FamilyDatabase(`dish-page-${crypto.randomUUID()}`);databases.push(db)
    render(<FamilyDataProvider database={db}><DishesPage/></FamilyDataProvider>)

    await screen.findByText('菜品目录 · 111 道')
    await user.type(screen.getByLabelText('搜索菜名或食材'),'番茄炒蛋')
    const dishName=await screen.findByText('番茄炒蛋',{selector:'strong'})
    const row=dishName.closest<HTMLElement>('[role="row"]')
    expect(row).not.toBeNull()
    await user.click(within(row!).getByRole('button',{name:'停用'}))

    expect(await screen.findByText('✓ 菜品已停用，记录仍然保留。')).toBeInTheDocument()
    expect(screen.queryByText('番茄炒蛋',{selector:'strong'})).not.toBeInTheDocument()
  })

  it('creates a dish and exposes a confirmed delete action for it',async()=>{
    const user=userEvent.setup()
    const db=new FamilyDatabase(`dish-page-${crypto.randomUUID()}`);databases.push(db)
    render(<FamilyDataProvider database={db}><DishesPage/></FamilyDataProvider>)
    expect(await screen.findByText('菜品目录 · 111 道')).toBeInTheDocument()
    await user.click(screen.getByRole('button',{name:'新增菜品'}))
    await user.type(screen.getByLabelText('菜名'),'葱爆肉片')
    await user.selectOptions(screen.getByLabelText('菜品类型'),'HOT')
    await user.click(screen.getByRole('button',{name:'选择猪肉'}))
    await user.click(screen.getByRole('button',{name:'保存菜品'}))
    expect(await screen.findByText('葱爆肉片',{selector:'strong'})).toBeInTheDocument()
    vi.spyOn(window,'confirm').mockReturnValue(true)
    await user.click(screen.getByRole('button',{name:'删除葱爆肉片'}))
    expect(await screen.findByText('✓ 葱爆肉片已删除。')).toBeInTheDocument()
    expect(screen.queryByText('葱爆肉片',{selector:'strong'})).not.toBeInTheDocument()
  })
})
