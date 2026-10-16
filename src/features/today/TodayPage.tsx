import { useMemo, useState } from 'react'
import type { Dish, DishType } from '../../domain/types'
import { generateMenu } from '../menu-engine/generateMenu'
import { replaceDish } from '../menu-engine/replaceDish'
import type { MenuGenerationResult } from '../menu-engine/types'
import { GenerationShortage } from './GenerationShortage'
import { ManualDishPicker } from './ManualDishPicker'
import { MealSetup, type MealSetupValue } from './MealSetup'
import { MenuResult } from './MenuResult'
import { PantryEditor } from './PantryEditor'
import { useFamilyData } from './useFamilyData'
import './today.css'

type PickerState = { mode:'replace'; dishId:string; type:DishType } | { mode:'add' }

export function TodayPage() {
  const { snapshot,repository,refresh,error }=useFamilyData()
  const [setup,setSetup]=useState<MealSetupValue>({selectedMemberIds:[],selectedCookId:'',configuration:{peopleCount:0,hotCount:3,coldCount:1,soupCount:1}})
  const [pantryOpen,setPantryOpen]=useState(false)
  const [menu,setMenu]=useState<Dish[]|null>(null)
  const [missing,setMissing]=useState<Record<string,string[]>>({})
  const [shownKeys,setShownKeys]=useState<string[]>([])
  const [shortage,setShortage]=useState<Extract<MenuGenerationResult,{ok:false}>|null>(null)
  const [picker,setPicker]=useState<PickerState|null>(null)
  const [status,setStatus]=useState('')
  const ingredientNames=useMemo(()=>Object.fromEntries((snapshot?.ingredients??[]).map((item)=>[item.id,item.name])),[snapshot])
  if(error) return <section className="page"><h1>今天吃什么</h1><div className="error-panel">{error}</div></section>
  if(!snapshot) return <section className="page loading"><h1>正在准备家里的菜单…</h1></section>
  const pantrySet=new Set(snapshot.pantry.filter((item)=>item.available).map((item)=>item.ingredientId))
  const selectedCook=snapshot.cooks.find((item)=>item.id===setup.selectedCookId)
  const cookableDishIds=new Set(snapshot.cookDishes.filter((item)=>item.cookId===setup.selectedCookId).map((item)=>item.dishId))
  const cookableDishes=snapshot.dishes.filter((item)=>cookableDishIds.has(item.id))
  const cookDishCounts=Object.fromEntries(snapshot.cooks.map((cook)=>[cook.id,snapshot.cookDishes.filter((item)=>item.cookId===cook.id&&snapshot.dishes.some((dish)=>dish.id===item.dishId&&dish.enabled)).length]))
  const engineInput={dishes:snapshot.dishes,allowedDishIds:cookableDishIds,ingredients:snapshot.ingredients,members:snapshot.members,preferences:snapshot.preferences,mealRecords:snapshot.mealRecords,selectedMemberIds:setup.selectedMemberIds,availableIngredientIds:pantrySet,configuration:setup.configuration,generatedMenuKeys:shownKeys,now:new Date()}

  const runGenerate=()=>{
    if(!selectedCook){setStatus('请先选择这顿饭由外婆还是爸爸来做。');return}
    if(!cookableDishes.some((item)=>item.enabled)){setStatus(`请先在“做菜人”里登记${selectedCook.name}会做的菜。`);return}
    if(setup.configuration.peopleCount<1){setStatus('请先选择今天吃饭的家人，或调整总人数。');return}
    if(setup.configuration.hotCount+setup.configuration.coldCount+setup.configuration.soupCount<1){setStatus('请至少选择一道热菜、凉菜或汤。');return}
    const result=generateMenu(engineInput)
    if(!result.ok){setShortage(result);return}
    setMenu(result.menu.dishes);setMissing(result.menu.missingIngredients);setShownKeys((keys)=>[...keys,result.menu.key]);setStatus(`菜单已生成，只安排${selectedCook.name}会做的菜。`)
  }
  if(pantryOpen) return <PantryEditor ingredients={snapshot.ingredients} pantry={snapshot.pantry} onToggle={async(id,available)=>{await repository.setPantryAvailability(id,available);await refresh()}} onClose={()=>setPantryOpen(false)}/>
  if(shortage) return <GenerationShortage result={shortage} onPantry={()=>{setShortage(null);setPantryOpen(true)}} onBack={()=>setShortage(null)} onAccept={()=>{setSetup((value)=>({...value,configuration:{...value.configuration,hotCount:shortage.shortage.available.HOT,coldCount:shortage.shortage.available.COLD,soupCount:shortage.shortage.available.SOUP}}));setShortage(null)}}/>
  if(picker) return <ManualDishPicker dishes={cookableDishes} cookName={selectedCook?.name ?? ''} type={picker.mode==='replace'?picker.type:undefined} selectedIds={menu?.map((dish)=>dish.id)??[]} onClose={()=>setPicker(null)} onChoose={(dish)=>{ if(picker.mode==='replace'&&menu){setMenu(menu.map((item)=>item.id===picker.dishId?dish:item))}else setMenu([...(menu??[]),dish]);setPicker(null);setStatus(`${dish.name}已经放进这一桌。`) }}/>
  if(menu) return <MenuResult dishes={menu} cookName={selectedCook?.name ?? ''} ingredientNames={ingredientNames} missingIngredients={missing} peopleCount={setup.configuration.peopleCount} status={status} onBack={()=>{setMenu(null);setStatus('')}} onDelete={(id)=>{setMenu(menu.filter((dish)=>dish.id!==id));setStatus('已从这桌删除一道菜。')}} onAdd={()=>setPicker({mode:'add'})} onManualReplace={(id)=>{const dish=menu.find((item)=>item.id===id)!;setPicker({mode:'replace',dishId:id,type:dish.type})}} onReplace={(id)=>{const result=replaceDish({...engineInput,currentDishes:menu,dishId:id});if(result.ok){setMenu(result.dishes);setStatus('只更换了这一道，其他菜保持不变。')}else setStatus(result.message)}} onReroll={runGenerate} onConfirm={async()=>{if(!selectedCook)return;await repository.confirmMeal({mealDate:localDate(new Date()),mealType:'DINNER',memberIds:setup.selectedMemberIds,peopleCount:setup.configuration.peopleCount,dishIds:menu.map((dish)=>dish.id),cookId:selectedCook.id});await refresh();setStatus(`✓ 今天晚餐已记录，之后随机会避开这些菜。`)}}/>
  const pantryNames=snapshot.ingredients.filter((item)=>pantrySet.has(item.id)&&!item.isStaple).map((item)=>item.name)
  return <section className="page today-page"><header className="today-header"><div><h1>今天吃什么</h1><p>照着顺序点几下，一桌家常饭就有了。</p></div>{status&&<div className="page-message" role="status">{status}</div>}</header><MealSetup members={snapshot.members} cooks={snapshot.cooks} cookDishCounts={cookDishCounts} pantrySummary={pantryNames.length?`${pantryNames.slice(0,4).join('、')}${pantryNames.length} 种`:'还没有选择主要食材'} presets={snapshot.presets} value={setup} onChange={(value)=>{setSetup(value);setStatus('')}} onEditPantry={()=>setPantryOpen(true)} onGenerate={runGenerate}/></section>
}

function localDate(date:Date){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`}
