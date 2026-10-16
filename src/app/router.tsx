import { useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { TodayPage } from '../features/today/TodayPage'
import { DishesPage } from '../features/dishes/DishesPage'
import { IngredientManager } from '../features/dishes/IngredientManager'
import { FamilyPage } from '../features/family/FamilyPage'
import { CooksPage } from '../features/family/CooksPage'
import { PreferencesPage } from '../features/family/PreferencesPage'
import { PresetManager } from '../features/family/PresetManager'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AppShell>
        <Routes>
          <Route path="/" element={<TodayPage />} />
          <Route path="/dishes" element={<DishesPage />} />
          <Route path="/ingredients" element={<IngredientManager />} />
          <Route path="/family" element={<FamilyPage />} />
          <Route path="/cooks" element={<CooksPage />} />
          <Route path="/preferences" element={<PreferencesPage />} />
          <Route path="/presets" element={<PresetManager />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  )
}
