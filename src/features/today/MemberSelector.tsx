import { Check } from 'lucide-react'
import type { Member } from '../../domain/types'

export function MemberSelector({ members, selectedIds, onToggle }: { members: Member[]; selectedIds: string[]; onToggle: (id: string) => void }) {
  return (
    <div className="member-grid">
      {members.filter((member) => member.enabled).map((member) => {
        const selected = selectedIds.includes(member.id)
        return (
          <button key={member.id} type="button" aria-label={`${selected ? '取消选择' : '选择'}${member.name}`} aria-pressed={selected} className="member-choice" onClick={() => onToggle(member.id)}>
            <span className="member-choice__avatar" aria-hidden="true">{member.avatarSeed}</span>
            <span>{member.name}</span>
            <span className="member-choice__state">{selected ? <><Check size={18} /> 已选</> : '未选'}</span>
          </button>
        )
      })}
    </div>
  )
}
