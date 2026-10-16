import { ArrowRight, ShoppingBasket, CheckCircle2 } from 'lucide-react'
import type { Cook, MealConfiguration, MealPreset, Member } from '../../domain/types'
import { Button } from '../../components/ui/Button'
import { MemberSelector } from './MemberSelector'
import { PeopleStepper } from './PeopleStepper'
import { CookSelector } from './CookSelector'

export interface MealSetupValue { selectedMemberIds: string[]; selectedCookId: string; configuration: MealConfiguration }

export function MealSetup({ members, cooks, cookDishCounts, pantrySummary, presets, value, onChange, onEditPantry, onGenerate }: {
  members: Member[]; cooks: Cook[]; cookDishCounts: Record<string, number>; pantrySummary: string; presets: MealPreset[]; value: MealSetupValue
  onChange: (value: MealSetupValue) => void; onEditPantry: () => void; onGenerate: () => void
}) {
  const updateConfig = (patch: Partial<MealConfiguration>) => onChange({ ...value, configuration: { ...value.configuration, ...patch } })
  const toggleMember = (id: string) => {
    const selected = value.selectedMemberIds.includes(id)
      ? value.selectedMemberIds.filter((item) => item !== id)
      : [...value.selectedMemberIds, id]
    const oldRegistered = value.selectedMemberIds.length
    const guestCount = Math.max(0, value.configuration.peopleCount - oldRegistered)
    onChange({ ...value, selectedMemberIds: selected, configuration: { ...value.configuration, peopleCount: selected.length + guestCount } })
  }
  const guestCount = Math.max(0, value.configuration.peopleCount - value.selectedMemberIds.length)
  return (
    <div className="meal-setup">
      <section className="setup-section">
        <div className="section-heading"><span className="step-number">1</span><div><h2>今天谁在家吃饭？</h2><p>点一下名字就选好了</p></div></div>
        <MemberSelector members={members} selectedIds={value.selectedMemberIds} onToggle={toggleMember} />
        <p className="inline-status"><CheckCircle2 size={20} aria-hidden="true" /> 已选择 {value.selectedMemberIds.length} 位家庭成员</p>
      </section>

      <section className="setup-section setup-section--row">
        <div className="section-heading"><span className="step-number">2</span><div><h2>今天共多少人？</h2><p>{guestCount ? `另有 ${guestCount} 位客人` : '有客人时再调整人数'}</p></div></div>
        <PeopleStepper label="总人数" ariaLabel="总人数" value={value.configuration.peopleCount} min={value.selectedMemberIds.length} onChange={(peopleCount) => updateConfig({ peopleCount })} />
      </section>

      <section className="setup-section">
        <div className="section-heading"><span className="step-number">3</span><div><h2>这顿谁做？</h2><p>选定后只会从这位做菜人登记过的菜里随机</p></div></div>
        <CookSelector cooks={cooks} selectedCookId={value.selectedCookId} dishCounts={cookDishCounts} onSelect={(selectedCookId) => onChange({ ...value, selectedCookId })} />
      </section>

      <section className="setup-section">
        <div className="section-heading"><span className="step-number">4</span><div><h2>家里有什么？</h2><p>只记主要食材，有或没有就够了</p></div></div>
        <div className="pantry-summary"><ShoppingBasket size={30} aria-hidden="true" /><strong>{pantrySummary}</strong><Button onClick={onEditPantry}>改一下</Button></div>
      </section>

      <section className="setup-section">
        <div className="section-heading"><span className="step-number">5</span><div><h2>这一顿怎么搭配？</h2><p>数量完全由你决定</p></div></div>
        <div className="structure-grid">
          <PeopleStepper label="热菜" ariaLabel="热菜数量" value={value.configuration.hotCount} max={10} onChange={(hotCount) => updateConfig({ hotCount })} />
          <PeopleStepper label="凉菜" ariaLabel="凉菜数量" value={value.configuration.coldCount} max={6} onChange={(coldCount) => updateConfig({ coldCount })} />
          <PeopleStepper label="汤" ariaLabel="汤数量" value={value.configuration.soupCount} max={4} onChange={(soupCount) => updateConfig({ soupCount })} />
        </div>
      </section>

      <section className="setup-section">
        <div className="section-heading"><span className="step-number">6</span><div><h2>快速选择搭配</h2><p>选完以后还能继续加减</p></div></div>
        <div className="preset-grid">
          {presets.filter((preset) => preset.enabled).map((preset) => (
            <button key={preset.id} type="button" aria-label={`${preset.name}，${preset.hotCount}热菜${preset.coldCount}凉菜${preset.soupCount}汤`} onClick={() => updateConfig({ hotCount:preset.hotCount,coldCount:preset.coldCount,soupCount:preset.soupCount })}>
              <strong>{preset.name}</strong><span>{formatPreset(preset)}</span>
            </button>
          ))}
        </div>
      </section>
      <Button variant="primary" className="generate-button" disabled={!value.selectedCookId} title={value.selectedCookId ? undefined : '请先选择这顿饭由谁做'} onClick={onGenerate}>随机这一桌 <ArrowRight aria-hidden="true" /></Button>
    </div>
  )
}

function formatPreset(preset: MealPreset) {
  return [preset.hotCount && `${preset.hotCount}热菜`, preset.coldCount && `${preset.coldCount}凉菜`, preset.soupCount && `${preset.soupCount}汤`].filter(Boolean).join(' · ')
}
