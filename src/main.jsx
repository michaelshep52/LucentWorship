import React from 'react'
import ReactDOM from 'react-dom/client'
import { localRoute } from './lib/local-route.js'
const route = localRoute(window.location.pathname)
// Opt-in local preview must not import or initialize the Supabase-backed app.
const App = React.lazy(() => route === 'library'
  ? import('./pages/LocalLibrary.jsx')
  : route === 'audience'
    ? import('./pages/LocalAudience.jsx')
    : import('./App.jsx'));
import '@/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.Suspense fallback={route === 'audience'
    ? <div style={{ position: 'fixed', inset: 0, background: 'black' }} />
    : <p role="status">Opening Lucent…</p>}>
    <App />
  </React.Suspense>
)
