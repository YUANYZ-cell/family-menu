import { ArrowLeft, CheckCircle2, Plus, RefreshCw } from 'lucide-react'
import type { Dish } from '../../domain/types'
import { Button } from '../../components/ui/Button'

export function MenuResult({ dishes, cookName, ingredientNames, missingIngredients, peopleCount, status, onReplace, onManualReplace, onDelete, onAdd, onReroll, onConfirm, onBack }: {
  dishes: Dish[]; cookName: string; ingredientNames: Record<string,string>; missingIngredients: Record<string,string[]>; peopleCount: number; status?: string
  onReplace:(id:string)=>void; onManualReplace:(id:string)=>void; onDelete:(id:string)=>void; onAdd:()=>void; onReroll:()=>void; onConfirm:()=>void; onBack:()=>void
}) {
  const counts = { HOT:dishes.filter((d)=>d.type==='HOT').length, COLD:dishes.filter((d)=>d.type==='COLD').length, SOUP:dishes.filter((d)=>d.type==='SOUP').length }
  return (
    <section className="page result-page">
      <button className="back-link" type="button" onClick={onBack}><ArrowLeft /> 返回调整</button>
      <div className="result-heading"><div><h1>今天这桌定好了</h1><p aria-label={`${cookName}下厨`}>今天 <strong>{peopleCount}</strong> 人 · 由 <strong>{cookName}</strong> 下厨 · {counts.HOT} 热菜 · {counts.COLD} 凉菜 · {counts.SOUP} 汤</p></div><div className="result-note"><CheckCircle2 /><span>{status || `菜单已生成，只安排${cookName}会做的菜。`}</span></div></div>
      <div className="dish-results">
        {dishes.map((dish) => (
          <article key={dish.id} className="dish-result-row">
            <span className={`dish-type dish-type--${dish.type.toLowerCase()}`}>{typeName(dish.type)}</span>
            <div className="dish-result-row__main"><h2>{dish.name}</h2><p>{dish.requiredIngredientIds.map((id)=>ingredientNames[id]).filter(Boolean).join('、')}</p>{missingIngredients[dish.id]?.length ? <p className="missing">还需要：{missingIngredients[dish.id].join('、')}</p> : null}</div>
            <div className="row-actions"><Button aria-label={`换掉${dish.name}`} onClick={()=>onReplace(dish.id)}>换一道</Button><Button onClick={()=>onManualReplace(dish.id)}>手动换</Button><Button variant="danger" onClick={()=>onDelete(dish.id)}>删除</Button></div>
          </article>
        ))}
      </div>
      <div className="result-actions"><Button onClick={onAdd}><Plus /> 加一道</Button><Button onClick={onReroll}><RefreshCw /> 重新随机</Button><Button variant="primary" onClick={onConfirm}>就吃这些</Button></div>
    </section>
  )
}

function typeName(type: Dish['type']) { return type==='HOT'?'热菜':type==='COLD'?'凉菜':'汤' }
