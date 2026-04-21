import { Home, ClipboardList, ChartColumn } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useStore } from "../store/useStore";
import { useAuth } from "../contexts/AuthContext";

const tabClass = ({ isActive }) =>
  `flex flex-col items-center gap-0.5 text-[11px] font-semibold pt-1 border-t-2 transition-colors ${
    isActive
      ? "text-live border-live"
      : "text-ink-secondary border-transparent"
  }`;

export default function BottomNav() {
  const { user } = useAuth();
  const { activeMatchId, matchDays } = useStore();
  const activeMatch = matchDays.find((m) => m.id === activeMatchId);
  const matchPath =
    !activeMatch || activeMatch.status === "setup"
      ? "/setup"
      : activeMatch.status === "teamsheet"
      ? "/teamsheet"
      : activeMatch.status === "teams"
      ? "/teams"
      : "/score";

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-border bg-white pb-[max(env(safe-area-inset-bottom),12px)] pt-2">
      <div className="mx-auto flex max-w-[480px] items-center justify-center gap-10">
        <NavLink to="/" end className={tabClass}>
          <Home size={20} />
          HOME
        </NavLink>
        {user && (
          <NavLink to={matchPath} className={tabClass}>
            <ClipboardList size={20} />
            MATCH
          </NavLink>
        )}
        <NavLink to="/stats" className={tabClass}>
          <ChartColumn size={20} />
          STATS
        </NavLink>
      </div>
    </nav>
  );
}
