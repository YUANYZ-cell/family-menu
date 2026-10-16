import { ArrowLeft, ShoppingBasket } from 'lucide-react'
import type { MenuGenerationResult } from '../menu-engine/types'
import { Button } from '../../components/ui/Button'

export function GenerationShortage({ result, onBack, onPantry, onAccept }: { result: Extract<MenuGenerationResult,{ok:false}>; onBack:()=>void; onPantry:()=>void; onAccept:()=>void }) {
  return <section className="page shortage-page"><ShoppingBasket size={50}/><h1>这次还差一点</h1><p>{result.shortage.message}</p>{result.shortage.missingIngredients.length?<p>补上这些食材会有更多选择：{result.shortage.missingIngredients.join('、')}</p>:null}<div><Button onClick={onPantry}>看看家里有什么</Button><Button onClick={onAccept}>按现有数量调整</Button><Button variant="quiet" onClick={onBack}><ArrowLeft/> 回去调整</Button></div></section>
}
