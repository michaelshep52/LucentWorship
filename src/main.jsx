import React from 'react'
import ReactDOM from 'react-dom/client'
import { localRoute } from './lib/local-route.js'
const route = localRoute(window.location.pathname)
// Opt-in local preview must not import or initialize the Supabase-backed app.
// Separate lazy callbacks also prevent Vite from preloading the cloud branch's CSS
// when building the local-only route (important during offline cold launch).
const App = route === 'library'
  ? React.lazy(() => import('./pages/LocalLibrary.jsx'))
  : route === 'audience'
    ? React.lazy(() => import('./pages/LocalAudience.jsx'))
    : React.lazy(() => import('./App.jsx'));
import '@/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.Suspense fallback={route === 'audience'
    ? <div style={{ position: 'fixed', inset: 0, background: 'black' }} />
    : <p role="status">Opening Lucent…</p>}>
    <App />
  </React.Suspense>
)
