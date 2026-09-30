import { BrowserRouter } from 'react-router'
import { AppProviders } from './AppProviders.tsx'
import { AppRoutes } from './AppRoutes.tsx'

// En GitHub Pages la app vive en /HanziBloom/: el router necesita esa base
// (Vite la expone en BASE_URL, que es '/' en desarrollo).
const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

export function App() {
  return (
    <BrowserRouter basename={basename}>
      <AppProviders>
        <AppRoutes />
      </AppProviders>
    </BrowserRouter>
  )
}
