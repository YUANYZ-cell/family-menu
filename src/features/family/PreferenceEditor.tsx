import { useState } from 'react'
import { ArrowLeft, Check } from 'lucide-react'
import type { Dish, Ingredient, Member, Preference, PreferenceLevel, PreferenceTarget } from '../../domain/types'
import { useFamilyData } from '../today/useFamilyData'

type Mode={label:string;targetType:PreferenceTarget;level:Exclude<PreferenceLevel,'NORMAL'>}
const modes:Mode[]=[{label:'喜欢的菜',targetType:'DISH',level:'LIKE'},{label:'喜欢的食材',targetType:'INGREDIENT',level:'LIKE'},{label:'不喜欢的菜',targetType:'DISH',level:'DISLIKE'},{label:'不喜欢的食材',targetType:'INGREDIENT',level:'DISLIKE'},{label:'尽量避免',targetType:'INGREDIENT',level:'AVOID'}]

export function PreferenceEditor({member,onBack}:{member:Member;onBack:()=>void}){
  const {snapshot,repository,refresh}=useFamilyData();const [mode,setMode]=useState<Mode|null>(null);const [message,setMessage]=useState('')
  if(!snapshot)return null
  const targets:(Dish|Ingredient)[]=mode?.targetType==='DISH'?snapshot.dishes.filter((item)=>item.enabled):snapshot.ingredients.filter((item)=>item.enabled&&!item.isStaple)
  const selected=(target:{id:string})=>snapshot.preferences.some((pref)=>pref.memberId===member.id&&pref.targetType===mode?.targetType&&pref.targetId===target.id&&pref.level===mode?.level)
  const toggle=async(target:{id:string;name:string})=>{if(!mode)return;const next:PreferenceLevel=selected(target)?'NORMAL':mode.level;await repository.setPreference(member.id,mode.targetType,target.id,next);await refresh();setMessage(next==='NORMAL'?`已取消：${member.name}对${target.name}的这项偏好`:`已保存：${member.name}${levelText(mode)}${target.name}`)}
  return <section className="page"><button className="back-link" type="button" onClick={onBack}><ArrowLeft/> 返回口味</button><div className="management-heading"><div><h1>{member.name}的口味</h1><p>这些设置只调整随机概率，不代表医学过敏或绝对禁忌。</p></div></div>{message&&<div className="page-message" role="status">{message}</div>}<div className="preference-modes">{modes.map((item)=><button type="button" aria-label={item.label} aria-pressed={mode?.label===item.label} key={item.label} onClick={()=>{setMode(item);setMessage('')}}>{item.label}<span>进入选择</span></button>)}</div>{mode&&<section className="preference-targets"><h2>{mode.label}</h2><p>点一下选择，再点一次取消。</p><div className="choice-grid choice-grid--large">{targets.map((target)=><button type="button" aria-label={`把${target.name}设为${mode.level==='LIKE'?'喜欢':mode.level==='DISLIKE'?'不喜欢':'尽量避免'}`} aria-pressed={selected(target)} key={target.id} onClick={()=>toggle(target)}>{selected(target)&&<Check size={18}/>} {target.name}</button>)}</div></section>}</section>
}
function levelText(mode:Mode){return mode.level==='LIKE'?'喜欢':mode.level==='DISLIKE'?'不喜欢':'尽量避免'}
