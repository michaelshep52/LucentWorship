import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import SongLibrary from './pages/SongLibrary';
import ScriptureBrowser from './pages/ScriptureBrowser';
import Presentations from './pages/Presentation';
import PresentationBuilder from './pages/PresentationBuilder';
import LiveMode from './pages/LiveMode';
import MediaLibrary from './pages/MediaLibrary';
import Login from './pages/Login';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isAuthenticated } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/songs" element={<SongLibrary />} />
        <Route path="/scripture" element={<ScriptureBrowser />} />
        <Route path="/presentations" element={<Presentations />} />
        <Route path="/presentations/:id" element={<PresentationBuilder />} />
        <Route path="/media" element={<MediaLibrary />} />
      </Route>
      <Route path="/live" element={<LiveMode />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
