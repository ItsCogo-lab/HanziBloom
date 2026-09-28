import { BrowserRouter } from 'react-router'
import { AppRoutes } from './AppRoutes.tsx'

export function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
