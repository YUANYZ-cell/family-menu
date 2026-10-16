import { useState } from 'react'
import { Check, X } from 'lucide-react'
import type { Dish, Ingredient, ProteinGroup } from '../../domain/types'
import { Button } from '../../components/ui/Button'

const proteinOptions: Array<[ProteinGroup,string]>=[['PLANT','素菜'],['PORK','猪肉'],['BEEF','牛肉'],['POULTRY','禽肉'],['FISH','鱼虾'],['EGG','蛋类'],['OTHER','其他']]

export function DishForm({ dish, ingredients, onSave, onCancel }: { dish?: Dish; ingredients: Ingredient[]; onSave:(dish: Omit<Dish,'id'|'createdAt'|'enabled'>|Dish)=>Promise<void>; onCancel:()=>void }) {
  const [name,setName]=useState(dish?.name??'')
  const [type,setType]=useState<Dish['type']>(dish?.type??'HOT')
  const [proteinGroup,setProteinGroup]=useState<ProteinGroup>(dish?.proteinGroup??'PLANT')
  const [selected,setSelected]=useState<string[]>(dish?.requiredIngredientIds??[])
  const [error,setError]=useState('')
  const submit=async()=>{try{await onSave(dish?{...dish,name,type,proteinGroup,requiredIngredientIds:selected}:{name,type,proteinGroup,requiredIngredientIds:selected});setError('')}catch(cause){setError(cause instanceof Error?cause.message:'没有保存成功，请再试一次。')}}
  return <aside className="edit-panel" aria-label={dish?'编辑菜品':'新增菜品'}><div className="edit-panel__heading"><h2>{dish?'编辑菜品':'新增菜品'}</h2><button type="button" aria-label="关闭编辑" onClick={onCancel}><X/></button></div>{error&&<div className="form-error" role="alert">{error}</div>}<label className="field">菜名<input aria-label="菜名" value={name} onChange={(event)=>setName(event.target.value)} placeholder="例如：芹菜炒肉"/></label><label className="field">类型<select aria-label="菜品类型" value={type} onChange={(event)=>setType(event.target.value as Dish['type'])}><option value="HOT">热菜</option><option value="COLD">凉菜</option><option value="SOUP">汤</option></select></label><label className="field">荤素与主材<select aria-label="菜品主材分组" value={proteinGroup} onChange={(event)=>setProteinGroup(event.target.value as ProteinGroup)}>{proteinOptions.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><fieldset className="choice-field"><legend>主要食材</legend><p>只选决定这道菜的食材，不用录油盐调料。</p><div className="choice-grid">{ingredients.filter((item)=>item.enabled&&!item.isStaple).map((item)=>{const active=selected.includes(item.id);return <button key={item.id} type="button" aria-label={`${active?'取消选择':'选择'}${item.name}`} aria-pressed={active} onClick={()=>setSelected(active?selected.filter((id)=>id!==item.id):[...selected,item.id])}>{active&&<Check size={17}/>} {item.name}</button>})}</div></fieldset><div className="panel-actions"><Button onClick={onCancel}>取消</Button><Button variant="primary" aria-label="保存菜品" onClick={submit}>保存</Button></div></aside>
}
