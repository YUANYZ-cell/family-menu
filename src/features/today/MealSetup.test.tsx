import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { Cook, MealConfiguration, Member } from '../../domain/types'
import { MealSetup, type MealSetupValue } from './MealSetup'

const members: Member[] = ['爷爷','奶奶','爸爸'].map((name,index) => ({ id:`m${index}`,name,avatarSeed:name[0],enabled:true,createdAt:index }))
const cooks: Cook[] = ['外婆', '爸爸'].map((name, index) => ({ id: `cook-${index}`, name, avatarSeed: name[0], createdAt: index }))

function Harness() {
  const [value, setValue] = useState<MealSetupValue>({ selectedMemberIds: [], selectedCookId: '', configuration: { peopleCount: 0, hotCount: 3, coldCount: 1, soupCount: 1 } })
  return <MealSetup members={members} cooks={cooks} cookDishCounts={{ 'cook-0': 8, 'cook-1': 4 }} pantrySummary="鸡蛋、番茄等 2 种" presets={[{ id:'p',name:'简单吃',hotCount:2,coldCount:0,soupCount:1,builtIn:true,enabled:true,sortOrder:0 }]} value={value} onChange={setValue} onEditPantry={vi.fn()} onGenerate={vi.fn()} />
}

describe('MealSetup', () => {
  it('keeps registered diners and total people separate while auto-counting selected members', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: '选择爷爷' }))
    await user.click(screen.getByRole('button', { name: '选择奶奶' }))
    expect(screen.getByText('已选择 2 位家庭成员')).toBeInTheDocument()
    expect(screen.getByLabelText('总人数')).toHaveTextContent('2')
    await user.click(screen.getByRole('button', { name: '增加总人数' }))
    expect(screen.getByLabelText('总人数')).toHaveTextContent('3')
    expect(screen.getByText('另有 1 位客人')).toBeInTheDocument()
  })

  it('uses a preset as editable values rather than a separate mode', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: '简单吃，2热菜0凉菜1汤' }))
    expect(screen.getByLabelText('热菜数量')).toHaveTextContent('2')
    expect(screen.getByLabelText('凉菜数量')).toHaveTextContent('0')
    await user.click(screen.getByRole('button', { name: '增加热菜' }))
    expect(screen.getByLabelText('热菜数量')).toHaveTextContent('3')
  })

  it('requires one of the two cooks before enabling menu generation', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    expect(screen.getByRole('button', { name: '随机这一桌' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: '选择外婆做菜' }))
    expect(screen.getByRole('button', { name: '选择外婆做菜' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '随机这一桌' })).toBeEnabled()
  })
})

export const testConfiguration: MealConfiguration = { peopleCount: 2, hotCount: 2, coldCount: 1, soupCount: 1 }
