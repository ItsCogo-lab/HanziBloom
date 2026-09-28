import { BrowserRouter } from 'react-router'
import { AppProviders } from './AppProviders.tsx'
import { AppRoutes } from './AppRoutes.tsx'

export function App() {
  return (
    <BrowserRouter>
      <AppProviders>
        <AppRoutes />
      </AppProviders>
    </BrowserRouter>
  )
}
