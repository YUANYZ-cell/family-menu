import { ArrowLeft, Check } from 'lucide-react'
import type { Dish, DishType } from '../../domain/types'
import { Button } from '../../components/ui/Button'

export function ManualDishPicker({ dishes, cookName, type, selectedIds, onChoose, onClose }: { dishes: Dish[]; cookName: string; type?: DishType; selectedIds: string[]; onChoose:(dish: Dish)=>void; onClose:()=>void }) {
  const available = dishes.filter((dish)=>dish.enabled && !selectedIds.includes(dish.id) && (!type || dish.type===type))
  return <section className="page subpage"><button className="back-link" type="button" onClick={onClose}><ArrowLeft /> 返回菜单</button><h1>{type ? `手动选择${type==='HOT'?'热菜':type==='COLD'?'凉菜':'汤'}` : '加一道菜'}</h1><p className="lead">只显示{cookName}登记会做的菜。</p><div className="manual-list">{available.map((dish)=><button type="button" key={dish.id} onClick={()=>onChoose(dish)}><span><strong>{dish.name}</strong><small>{dish.type==='HOT'?'热菜':dish.type==='COLD'?'凉菜':'汤'}</small></span><span><Check /> 选这道</span></button>)}</div>{!available.length&&<div className="empty-state">{cookName}暂时没有其他合适的菜，可以先去“做菜人”登记。</div>}<Button onClick={onClose}>不选了</Button></section>
}
