import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { FamilyDatabase } from '../../data/db'
import { FamilyDataProvider } from '../today/useFamilyData'
import { PreferencesPage } from './PreferencesPage'

const databases: FamilyDatabase[] = []
afterEach(async () => { await Promise.all(databases.splice(0).map((db) => db.delete())) })

describe('PreferencesPage', () => {
  it('opens a member preference editor and persists a selected dish preference', async () => {
    const user = userEvent.setup()
    const db = new FamilyDatabase(`preferences-page-${crypto.randomUUID()}`)
    databases.push(db)
    render(<FamilyDataProvider database={db}><PreferencesPage /></FamilyDataProvider>)

    await user.click(await screen.findByRole('button', { name: '设置爷爷的偏好' }))
    await user.click(screen.getByRole('button', { name: '喜欢的菜' }))
    await user.click(screen.getByRole('button', { name: '把番茄炒蛋设为喜欢' }))
    expect(await screen.findByText('已保存：爷爷喜欢番茄炒蛋')).toBeInTheDocument()
  })
})
