import { BrowserRouter } from 'react-router'
import { AppProviders } from './AppProviders.tsx'
import { AppRoutes } from './AppRoutes.tsx'

// On GitHub Pages the app lives at /HanziBloom/: the router needs that base
// (Vite exposes it as BASE_URL, which is '/' in development).
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
