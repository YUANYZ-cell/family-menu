import { AppRouter } from './router'
import { FamilyDataProvider } from '../features/today/useFamilyData'

export function App() {
  return <FamilyDataProvider><AppRouter /></FamilyDataProvider>
}
