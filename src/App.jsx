import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { isSupabaseConfigured } from "./lib/supabase";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Setup from "./pages/Setup";
import Teamsheet from "./pages/Teamsheet";
import Teams from "./pages/Teams";
import ScoreEntry from "./pages/ScoreEntry";
import Stats from "./pages/Stats";
import MatchDetails from "./pages/MatchDetails";

function SetupRequired() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-6">
      <div className="max-w-md w-full bg-white border border-border rounded-xl p-8 text-center">
        <div className="text-ink text-4xl mb-4">⚙️</div>
        <h1 className="text-2xl font-black text-ink mb-4">Setup Required</h1>
        <p className="text-ink-secondary mb-6">
          Supabase is not configured. Please create a{" "}
          <code className="bg-surface border border-border px-2 py-1 rounded text-sm">.env</code>{" "}
          file with your Supabase credentials.
        </p>
        <div className="bg-surface border border-border p-4 rounded-xl text-left text-sm text-ink-secondary mb-6">
          <div className="font-semibold mb-2 text-ink">Required environment variables:</div>
          <div><code>VITE_SUPABASE_URL=your_project_url</code></div>
          <div><code>VITE_SUPABASE_ANON_KEY=your_anon_key</code></div>
        </div>
        <p className="text-sm text-ink-secondary">
          Check the README.md for complete setup instructions.
        </p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-ink-secondary text-xl font-medium">Loading...</div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}

function AppContent() {
  const { user, loading } = useAuth();

  if (!isSupabaseConfigured) {
    return <SetupRequired />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-ink-secondary text-xl font-medium">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route element={<Layout />}>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/match/:matchId" element={<MatchDetails />} />
        {/* Auth-gated admin routes */}
        <Route path="/setup" element={<ProtectedRoute><Setup /></ProtectedRoute>} />
        <Route path="/teamsheet" element={<ProtectedRoute><Teamsheet /></ProtectedRoute>} />
        <Route path="/teams" element={<ProtectedRoute><Teams /></ProtectedRoute>} />
        <Route path="/score" element={<ProtectedRoute><ScoreEntry /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
