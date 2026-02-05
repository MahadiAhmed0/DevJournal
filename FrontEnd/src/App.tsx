import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/layout/Layout';
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import Entries from '@/pages/Entries';
import EntryForm from '@/pages/EntryForm';
import EntryDetail from '@/pages/EntryDetail';
import Snippets from '@/pages/Snippets';
import SnippetForm from '@/pages/SnippetForm';
import SnippetDetail from '@/pages/SnippetDetail';
import Profile from '@/pages/Profile';
import PublicProfile from '@/pages/PublicProfile';
import TagEntries from '@/pages/TagEntries';

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Public route wrapper (redirect if already logged in)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <Routes>
      {/* Public landing page */}
      <Route path="/" element={<Landing />} />

      {/* Auth routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* Public profile route */}
      <Route path="/u/:username" element={<PublicProfile />} />

      {/* Tag entries route */}
      <Route path="/tags/:slug" element={<TagEntries />} />

      {/* Protected routes */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="entries" element={<Entries />} />
        <Route path="entries/new" element={<EntryForm />} />
        <Route path="entries/:id" element={<EntryDetail />} />
        <Route path="entries/:id/edit" element={<EntryForm />} />
        <Route path="snippets" element={<Snippets />} />
        <Route path="snippets/new" element={<SnippetForm />} />
        <Route path="snippets/:id" element={<SnippetDetail />} />
        <Route path="snippets/:id/edit" element={<SnippetForm />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
