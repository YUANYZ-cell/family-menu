import { useState } from 'react'
import { Settings2 } from 'lucide-react'
import type { Member } from '../../domain/types'
import { Button } from '../../components/ui/Button'
import { useFamilyData } from '../today/useFamilyData'
import { PreferenceEditor } from './PreferenceEditor'
import '../dishes/management.css'
import './preferences.css'

export function PreferencesPage() {
  const { snapshot, error } = useFamilyData()
  const [member, setMember] = useState<Member | null>(null)

  if (error) return <section className="page"><div className="error-panel">{error}</div></section>
  if (!snapshot) return <section className="page loading"><h1>正在打开口味设置…</h1></section>
  if (member) return <PreferenceEditor member={member} onBack={() => setMember(null)} />

  return (
    <section className="page management-page">
      <div className="management-heading">
        <div><h1>家人的口味</h1><p>先选择一位家人，再维护他喜欢、不喜欢或尽量避免的菜和食材。</p></div>
      </div>
      <div className="preference-member-grid">
        {snapshot.members.filter((item) => item.enabled).map((item) => (
          <article key={item.id}>
            <span className="large-avatar">{item.avatarSeed}</span>
            <div><h2>{item.name}</h2><p>{snapshot.preferences.filter((pref) => pref.memberId === item.id).length} 项已设置</p></div>
            <Button aria-label={`设置${item.name}的偏好`} onClick={() => setMember(item)}><Settings2 /> 设置口味</Button>
          </article>
        ))}
      </div>
    </section>
  )
}
