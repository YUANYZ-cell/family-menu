import type { PropsWithChildren } from 'react'
import { ChefHat, CookingPot, Heart, House, SlidersHorizontal, Sprout, UsersRound } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const items = [
  { to: '/', label: '今天吃什么', icon: House },
  { to: '/dishes', label: '菜品', icon: CookingPot },
  { to: '/ingredients', label: '食材', icon: Sprout },
  { to: '/family', label: '家庭', icon: UsersRound },
  { to: '/cooks', label: '做菜人', icon: ChefHat },
  { to: '/preferences', label: '口味', icon: Heart },
  { to: '/presets', label: '菜单预设', icon: SlidersHorizontal },
]

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand" aria-label="今天吃什么">
          <span className="brand__mark"><img src="/icons/app-icon-48.png?v=2" alt="" /></span>
          <span>家常一桌</span>
        </div>
        <nav aria-label="主导航" className="main-nav">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} end={to === '/'} to={to}>
              <Icon aria-hidden="true" size={24} strokeWidth={1.8} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <p className="sidebar__note">一家人的菜单，<br />在这儿慢慢攒起来。</p>
      </aside>
      <main className="workspace">{children}</main>
    </div>
  )
}
