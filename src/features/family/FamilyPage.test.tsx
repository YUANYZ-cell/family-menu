import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FamilyDatabase } from '../../data/db'
import { FamilyDataProvider } from '../today/useFamilyData'
import { FamilyPage } from './FamilyPage'

const databases: FamilyDatabase[]=[]
afterEach(async()=>{await Promise.all(databases.splice(0).map((db)=>db.delete()))})

describe('FamilyPage',()=>{
  it('adds a family member without mixing in the separate preference workflow',async()=>{
    const user=userEvent.setup()
    const db=new FamilyDatabase(`family-page-${crypto.randomUUID()}`);databases.push(db)
    render(<FamilyDataProvider database={db}><FamilyPage/></FamilyDataProvider>)
    expect(await screen.findByText('爷爷')).toBeInTheDocument()
    await user.click(screen.getByRole('button',{name:'新增家庭成员'}))
    await user.type(screen.getByLabelText('成员称呼'),'外婆')
    await user.click(screen.getByRole('button',{name:'保存成员'}))
    expect(await screen.findByText('外婆')).toBeInTheDocument()
  })

  it('deletes a saved family member after confirmation',async()=>{
    const user=userEvent.setup()
    const confirm=vi.spyOn(window,'confirm').mockReturnValue(true)
    const db=new FamilyDatabase(`family-page-delete-${crypto.randomUUID()}`);databases.push(db)
    render(<FamilyDataProvider database={db}><FamilyPage/></FamilyDataProvider>)
    expect(await screen.findByText('爷爷')).toBeInTheDocument()

    await user.click(screen.getByRole('button',{name:'删除爷爷'}))

    expect(await screen.findByText('✓ 爷爷已删除，历史用餐记录仍然保留。')).toBeInTheDocument()
    expect(screen.queryByRole('heading',{name:'爷爷'})).not.toBeInTheDocument()
    expect(confirm).toHaveBeenCalledWith('确定删除“爷爷”吗？该成员的口味设置会一起删除，历史用餐记录仍会保留。')
    confirm.mockRestore()
  })
})
