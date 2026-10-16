import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Search, Trash2 } from 'lucide-react'
import type { Dish, DishType } from '../../domain/types'
import { Button } from '../../components/ui/Button'
import { useFamilyData } from '../today/useFamilyData'
import { DishForm } from './DishForm'
import './management.css'
import './catalog-layout.css'
import './delete-actions.css'

const PAGE_SIZE = 10

export function DishesPage() {
  const { snapshot, repository, refresh, error } = useFamilyData()
  const [filter, setFilter] = useState<'ALL' | DishType>('ALL')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<Dish | 'new' | null>(null)
  const [message, setMessage] = useState('')
  const ingredientNames = useMemo(
    () => Object.fromEntries((snapshot?.ingredients ?? []).map((item) => [item.id, item.name])),
    [snapshot],
  )

  useEffect(() => setPage(1), [filter, query])

  if (error) return <section className="page"><div className="error-panel">{error}</div></section>
  if (!snapshot) return <section className="page loading"><h1>正在打开家里的菜…</h1></section>

  const normalizedQuery = query.trim().toLocaleLowerCase('zh-CN')
  const filtered = snapshot.dishes
    .filter((dish) => {
      if (!dish.enabled || (filter !== 'ALL' && dish.type !== filter)) return false
      const searchable = `${dish.name} ${dish.requiredIngredientIds.map((id) => ingredientNames[id]).join(' ')}`.toLocaleLowerCase('zh-CN')
      return !normalizedQuery || searchable.includes(normalizedQuery)
    })
    .sort((left, right) => right.createdAt - left.createdAt)
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const save = async (value: Omit<Dish, 'id' | 'createdAt' | 'enabled'> | Dish) => {
    if ('id' in value) {
      await repository.saveDish(value)
    } else {
      await repository.createDish(value)
      setFilter('ALL')
      setQuery(value.name)
    }
    await refresh()
    setEditing(null)
    setMessage('✓ 菜品已经保存，可以参加随机。')
  }
  const toggle = async (dish: Dish) => {
    await repository.toggleDish(dish.id, !dish.enabled)
    await refresh()
    setMessage(dish.enabled ? '✓ 菜品已停用，记录仍然保留。' : '✓ 菜品已重新启用。')
  }
  const remove = async (dish: Dish) => {
    if (!window.confirm(`确定删除“${dish.name}”吗？若它已被用餐记录或口味设置使用，系统会保留它并改为停用。`)) return
    const outcome = await repository.removeDish(dish.id)
    if (editing !== 'new' && editing?.id === dish.id) setEditing(null)
    await refresh()
    setMessage(outcome === 'deleted' ? `✓ ${dish.name}已删除。` : `✓ ${dish.name}已被使用，已改为停用。`)
  }

  return (
    <section className={`page management-page ${editing ? 'management-page--editing' : ''}`}>
      <div className="management-main">
        <div className="management-heading">
          <div>
            <div className="eyebrow">菜品目录 · {filtered.length} 道</div>
            <h1>家里的菜</h1>
            <p>按类型或食材快速找到一道菜，每页只保留一眼能看完的数量。</p>
          </div>
          <div className="heading-actions">
            <Button variant="primary" aria-label="新增菜品" onClick={() => setEditing('new')}><Plus /> 新增菜品</Button>
          </div>
        </div>
        {message && <div className="page-message" role="status">{message}</div>}
        <div className="catalog-toolbar">
          <div className="filter-tabs" aria-label="菜品类型筛选">
            {([['ALL', '全部'], ['HOT', '热菜'], ['COLD', '凉菜'], ['SOUP', '汤']] as const).map(([value, label]) => (
              <button type="button" key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>
            ))}
          </div>
          <label className="search-field">
            <Search />
            <span className="sr-only">搜索菜名或食材</span>
            <input aria-label="搜索菜名或食材" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜菜名或主要食材" />
          </label>
        </div>
        <div className="catalog-status">
          <span>{normalizedQuery ? `“${query.trim()}”找到 ${filtered.length} 道` : `共 ${filtered.length} 道可用菜品`}</span>
          <span>第 {currentPage} / {pageCount} 页</span>
        </div>
        <div className="data-table dish-catalog" role="table" aria-label="菜品列表">
          <div className="data-table__header" role="row"><span>菜名</span><span>类型</span><span>主要食材</span><span>操作</span></div>
          {visible.map((dish) => (
            <div className="data-table__row" role="row" key={dish.id}>
              <strong>{dish.name}</strong>
              <span><span className={`type-badge type-badge--${dish.type.toLocaleLowerCase()}`}>{typeName(dish.type)}</span></span>
              <span>{dish.requiredIngredientIds.map((id) => ingredientNames[id]).filter(Boolean).join('、')}</span>
              <span className="table-actions">
                <Button onClick={() => setEditing(dish)}>编辑</Button>
                <Button variant="danger" onClick={() => toggle(dish)}>停用</Button>
                <Button variant="danger" aria-label={`删除${dish.name}`} onClick={() => remove(dish)}><Trash2 size={17} /> 删除</Button>
              </span>
            </div>
          ))}
        </div>
        {!visible.length && <div className="empty-state">没有找到符合条件的菜，换个关键词试试。</div>}
        {filtered.length > PAGE_SIZE && <CatalogPagination page={currentPage} pageCount={pageCount} onChange={setPage} />}
      </div>
      {editing && <DishForm dish={editing === 'new' ? undefined : editing} ingredients={snapshot.ingredients} onSave={save} onCancel={() => setEditing(null)} />}
    </section>
  )
}

function CatalogPagination({ page, pageCount, onChange }: { page: number; pageCount: number; onChange: (page: number) => void }) {
  return (
    <nav className="catalog-pagination" aria-label="菜品翻页">
      <button type="button" aria-label="上一页" disabled={page === 1} onClick={() => onChange(page - 1)}><ChevronLeft /></button>
      <div>{Array.from({ length: pageCount }, (_, index) => index + 1).map((value) => <button type="button" key={value} aria-label={`第${value}页`} aria-current={page === value ? 'page' : undefined} onClick={() => onChange(value)}>{value}</button>)}</div>
      <button type="button" aria-label="下一页" disabled={page === pageCount} onClick={() => onChange(page + 1)}><ChevronRight /></button>
    </nav>
  )
}

function typeName(type: DishType) { return type === 'HOT' ? '热菜' : type === 'COLD' ? '凉菜' : '汤' }
