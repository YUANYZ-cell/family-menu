import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import type { FamilySnapshot } from '../../domain/types'
import { db as defaultDb, FamilyDatabase } from '../../data/db'
import { FamilyRepository } from '../../data/repositories'
import { seedIfEmpty } from '../../data/seed'

interface FamilyContextValue { snapshot: FamilySnapshot | null; repository: FamilyRepository; refresh: () => Promise<void>; error: string }
const FamilyContext = createContext<FamilyContextValue | null>(null)

export function FamilyDataProvider({ children, database = defaultDb }: PropsWithChildren<{ database?: FamilyDatabase }>) {
  const repository = useMemo(()=>new FamilyRepository(database),[database])
  const [snapshot,setSnapshot]=useState<FamilySnapshot|null>(null)
  const [error,setError]=useState('')
  const refresh=useCallback(async()=>{ try { setSnapshot(await repository.getSnapshot()); setError('') } catch { setError('本地数据暂时没有打开，请刷新页面再试。') } },[repository])
  useEffect(()=>{ void seedIfEmpty(database).then(refresh).catch(()=>setError('本地数据暂时没有打开，请刷新页面再试。')) },[database,refresh])
  return <FamilyContext.Provider value={{snapshot,repository,refresh,error}}>{children}</FamilyContext.Provider>
}

export function useFamilyData() { const value=useContext(FamilyContext); if(!value) throw new Error('FamilyDataProvider is missing'); return value }
