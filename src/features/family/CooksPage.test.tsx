import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { FamilyDatabase } from '../../data/db'
import { FamilyDataProvider } from '../today/useFamilyData'
import { CooksPage } from './CooksPage'

const databases: FamilyDatabase[] = []
afterEach(async () => { await Promise.all(databases.splice(0).map((db) => db.delete())) })

describe('CooksPage', () => {
  it('keeps the two fixed cooks and persists each cook\'s dish list', async () => {
    const user = userEvent.setup()
    const db = new FamilyDatabase(`cooks-page-${crypto.randomUUID()}`)
    databases.push(db)
    render(<FamilyDataProvider database={db}><CooksPage /></FamilyDataProvider>)

    expect(await screen.findByRole('heading', { name: '做菜人' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '登记外婆会做的菜' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '登记爸爸会做的菜' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /新增做菜人/ })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '登记外婆会做的菜' }))
    const dish = screen.getByRole('button', { name: '把番茄炒蛋设为外婆会做' })
    expect(dish).toHaveAttribute('aria-pressed', 'false')
    await user.click(dish)
    expect(await screen.findByText('已登记：外婆会做番茄炒蛋。')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '把番茄炒蛋设为外婆会做' })).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('button', { name: '返回做菜人' }))
    expect(screen.getByText('已登记会做 1 道菜')).toBeInTheDocument()
  })
})
