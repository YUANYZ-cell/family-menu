import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppShell } from './AppShell'

describe('AppShell', () => {
  it('shows the seven focused product destinations and marks the current page', () => {
    render(
      <MemoryRouter initialEntries={['/dishes']}>
        <AppShell><div>内容</div></AppShell>
      </MemoryRouter>,
    )

    const navigation = screen.getByRole('navigation', { name: '主导航' })
    expect(navigation.querySelectorAll('a')).toHaveLength(7)
    expect(screen.getByRole('link', { name: '今天吃什么' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '菜品' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: '食材' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '家庭' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '做菜人' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '口味' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '菜单预设' })).toBeInTheDocument()
  })
})
