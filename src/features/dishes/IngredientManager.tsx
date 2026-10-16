import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Search, Trash2 } from 'lucide-react'
import type { Ingredient } from '../../domain/types'
import { Button } from '../../components/ui/Button'
import { useFamilyData } from '../today/useFamilyData'
import './management.css'
import './catalog-layout.css'
import './delete-actions.css'

const PAGE_SIZE = 9

export function IngredientManager() {
  const { snapshot, repository, refresh, error } = useFamilyData()
  const [name, setName] = useState('')
  const [category, setCategory] = useState('蔬菜')
  const [activeCategory, setActiveCategory] = useState('全部')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [message, setMessage] = useState('')

  useEffect(() => setPage(1), [activeCategory, query])

  const catalog = useMemo(() => snapshot?.ingredients.filter((item) => !item.isStaple) ?? [], [snapshot])
  const categories = useMemo(() => {
    const counts = new Map<string, number>()
    catalog.forEach((item) => counts.set(item.category, (counts.get(item.category) ?? 0) + 1))
    return [['全部', catalog.length] as const, ...Array.from(counts.entries()).sort((a, b) => b[1] - a[1])]
  }, [catalog])

  if (error) return <section className="page"><div className="error-panel">{error}</div></section>
  if (!snapshot) return <section className="page loading"><h1>正在打开食材…</h1></section>

  const normalizedQuery = query.trim().toLocaleLowerCase('zh-CN')
  const filtered = catalog.filter((item) => (activeCategory === '全部' || item.category === activeCategory) && (!normalizedQuery || item.name.toLocaleLowerCase('zh-CN').includes(normalizedQuery)))
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const create = async () => {
    try {
      await repository.createIngredient({ name, category, isStaple: false })
      const createdName = name.trim()
      setName('')
      setActiveCategory('全部')
      setQuery(createdName)
      await refresh()
      setMessage('✓ 新食材已经添加。')
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : '没有保存成功。')
    }
  }
  const toggle = async (item: Ingredient) => {
    await repository.toggleIngredient(item.id, !item.enabled)
    await refresh()
    setMessage(item.enabled ? '✓ 食材已停用，已有菜品记录会保留。' : '✓ 食材已重新启用。')
  }
  const remove = async (item: Ingredient) => {
    if (!window.confirm(`确定删除“${item.name}”吗？若它已被菜品或口味设置使用，系统会保留它并改为停用。`)) return
    const outcome = await repository.removeIngredient(item.id)
    await refresh()
    setMessage(outcome === 'deleted' ? `✓ ${item.name}已删除。` : `✓ ${item.name}已被使用，已改为停用。`)
  }

  return (
    <section className="page management-page">
      <div className="management-heading ingredient-heading">
        <div>
          <div className="eyebrow">食材目录 · {catalog.length} 种</div>
          <h1>家里的食材</h1>
          <p>按分类进入小目录，不用再从头翻到尾。</p>
        </div>
        <label className="search-field">
          <Search />
          <span className="sr-only">搜索食材</span>
          <input aria-label="搜索食材" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="快速搜索食材" />
        </label>
      </div>
      {message && <div className="page-message" role="status">{message}</div>}
      <div className="inline-create inline-create--compact">
        <div className="inline-create__intro"><Plus /><div><strong>添加新食材</strong><span>保存后会自动定位到它</span></div></div>
        <label>食材名称<input aria-label="新食材名称" value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：芹菜" /></label>
        <label>分类<select aria-label="食材分类" value={category} onChange={(event) => setCategory(event.target.value)}><option>蔬菜</option><option>肉类</option><option>水产</option><option>蛋奶</option><option>豆制品</option><option>菌菇</option><option>腌菜</option><option>调味</option><option>干货</option><option>其他</option></select></label>
        <Button variant="primary" onClick={create}><Plus /> 添加</Button>
      </div>
      <div className="ingredient-browser">
        <aside className="category-directory" aria-label="食材分类">
          <div className="category-directory__title">分类目录</div>
          {categories.map(([value, count]) => <button type="button" key={value} aria-pressed={activeCategory === value} onClick={() => setActiveCategory(value)}><span>{value}</span><strong>{count}</strong></button>)}
        </aside>
        <div className="ingredient-results">
          <div className="catalog-status"><span>{activeCategory === '全部' ? '全部食材' : activeCategory} · {filtered.length} 种</span><span>第 {currentPage} / {pageCount} 页</span></div>
          <div className="ingredient-grid" aria-label="食材列表">
            {visible.map((item) => (
              <article key={item.id} className={!item.enabled ? 'is-disabled' : ''}>
                <div className="ingredient-card__top"><span className="ingredient-category">{item.category}</span><span className="usage-count">{item.usageCount} 道菜使用</span></div>
                <h3>{item.name}</h3>
                <div className="ingredient-actions">
                  <Button variant={item.enabled ? 'danger' : 'secondary'} onClick={() => toggle(item)}>{item.enabled ? '停用' : '重新启用'}</Button>
                  <Button variant="danger" aria-label={`删除${item.name}`} onClick={() => remove(item)}><Trash2 size={17} /> 删除</Button>
                </div>
              </article>
            ))}
          </div>
          {!visible.length && <div className="empty-state">这个分类里没有找到相关食材。</div>}
          {filtered.length > PAGE_SIZE && <IngredientPagination page={currentPage} pageCount={pageCount} onChange={setPage} />}
        </div>
      </div>
    </section>
  )
}

function IngredientPagination({ page, pageCount, onChange }: { page: number; pageCount: number; onChange: (page: number) => void }) {
  return <nav className="catalog-pagination" aria-label="食材翻页"><button type="button" aria-label="上一页" disabled={page === 1} onClick={() => onChange(page - 1)}><ChevronLeft /></button><div>{Array.from({ length: pageCount }, (_, index) => index + 1).map((value) => <button type="button" key={value} aria-label={`第${value}页`} aria-current={page === value ? 'page' : undefined} onClick={() => onChange(value)}>{value}</button>)}</div><button type="button" aria-label="下一页" disabled={page === pageCount} onClick={() => onChange(page + 1)}><ChevronRight /></button></nav>
}
