import { useState } from 'react'
import { Pencil, Plus } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import type { MealPreset } from '../../domain/types'
import { PeopleStepper } from '../today/PeopleStepper'
import { useFamilyData } from '../today/useFamilyData'
import './preset-manager.css'

const defaultCounts = { hotCount: 3, coldCount: 0, soupCount: 1 }

export function PresetManager() {
  const { snapshot, repository, refresh } = useFamilyData()
  const [name, setName] = useState('')
  const [counts, setCounts] = useState(defaultCounts)
  const [editing, setEditing] = useState<MealPreset | null>(null)
  const [message, setMessage] = useState('')

  if (!snapshot) return null

  const resetEditor = () => {
    setName('')
    setCounts(defaultCounts)
    setEditing(null)
  }

  const beginEdit = (preset: MealPreset) => {
    setEditing(preset)
    setName(preset.name)
    setCounts({ hotCount: preset.hotCount, coldCount: preset.coldCount, soupCount: preset.soupCount })
    setMessage('')
  }

  const save = async () => {
    try {
      if (editing) {
        await repository.savePreset({ ...editing, name, ...counts })
        setMessage('✓ 预设修改已经保存。')
      } else {
        await repository.savePreset({ name, ...counts, builtIn: false, enabled: true, sortOrder: snapshot.presets.length })
        setMessage('✓ 新预设已经保存。')
      }
      resetEditor()
      await refresh()
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : '没有保存成功。')
    }
  }

  return (
    <section className="page management-page">
      <div className="management-heading">
        <div><h1>菜单预设</h1><p>预设只负责快速填写热菜、凉菜和汤的数量。</p></div>
      </div>
      {message && <div className="page-message" role="status">{message}</div>}
      <div className="preset-editor">
        <label className="field">预设名称<input value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：周末晚饭" /></label>
        <div className="structure-grid">
          <PeopleStepper label="热菜" ariaLabel="预设热菜数量" value={counts.hotCount} onChange={(hotCount) => setCounts({ ...counts, hotCount })} />
          <PeopleStepper label="凉菜" ariaLabel="预设凉菜数量" value={counts.coldCount} onChange={(coldCount) => setCounts({ ...counts, coldCount })} />
          <PeopleStepper label="汤" ariaLabel="预设汤数量" value={counts.soupCount} onChange={(soupCount) => setCounts({ ...counts, soupCount })} />
        </div>
        <div className="preset-editor__actions">
          {editing && <Button onClick={resetEditor}>取消修改</Button>}
          <Button variant="primary" aria-label={editing ? '保存修改' : '保存为新预设'} onClick={save}>
            {editing ? <Pencil /> : <Plus />} {editing ? '保存修改' : '保存为新预设'}
          </Button>
        </div>
      </div>
      <div className="management-list">
        {snapshot.presets.map((item) => (
          <article key={item.id} className={!item.enabled ? 'is-disabled' : ''}>
            <div><h3>{item.name}</h3><p>{item.hotCount} 热菜 · {item.coldCount} 凉菜 · {item.soupCount} 汤{item.builtIn ? ' · 内置' : ''}</p></div>
            <div className="member-actions">
              <Button aria-label={`编辑${item.name}`} onClick={() => beginEdit(item)}><Pencil /> 编辑</Button>
              <Button variant={item.enabled ? 'danger' : 'secondary'} onClick={async () => { await repository.togglePreset(item.id, !item.enabled); await refresh() }}>{item.enabled ? '停用' : '启用'}</Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
