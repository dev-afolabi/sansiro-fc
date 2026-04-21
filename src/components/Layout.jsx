import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import BottomNav from "./BottomNav";

export default function Layout() {
  const { user, signOut } = useAuth();

  return (
    <>
      <header className="bg-white border-b border-border px-4 py-3">
        <div className="mx-auto max-w-[480px] flex items-center justify-between">
          <h1 className="text-xl font-black uppercase tracking-tight text-ink">SANSIRO FC</h1>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <span className="text-xs text-ink-secondary bg-surface border border-border px-2 py-1 rounded-full hidden sm:block">
                  {user.email}
                </span>
                <button
                  onClick={signOut}
                  className="text-sm text-ink-secondary hover:text-ink px-3 py-1 rounded-lg hover:bg-surface transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <NavLink
                to="/login"
                className="text-sm font-semibold text-ink hover:text-ink-secondary transition-colors"
              >
                Sign In
              </NavLink>
            )}
          </div>
        </div>
      </header>
      <main className="app-shell">
        <Outlet />
      </main>
      <BottomNav />
    </>
  );
}
