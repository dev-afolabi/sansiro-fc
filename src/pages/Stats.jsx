import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import { useAuth } from "../contexts/AuthContext";
import { formatMatchDate } from "../utils/date";

const statFields = {
  points:        { label: "Pts",  get: (p) => p.points },
  total_goals:   { label: "GF",   get: (p) => p.total_goals },
  total_conceded:{ label: "GA",   get: (p) => p.total_conceded },
  goalDiff:      { label: "GD",   get: (p) => p.total_goals - p.total_conceded },
  wins:          { label: "W",    get: (p) => p.wins },
  draws:         { label: "D",    get: (p) => p.draws },
  losses:        { label: "L",    get: (p) => p.losses },
  matches_played:{ label: "MP",   get: (p) => p.matches_played },
};

export default function Stats() {
  const [tab, setTab] = useState("leaderboard");
  const [sortFields, setSortFields] = useState([
    { key: "points", dir: "desc" },
    { key: "total_goals", dir: "desc" },
    { key: "wins", dir: "desc" },
    { key: "losses", dir: "asc" },
  ]);
  const { user } = useAuth();
  const { players, matchDays, initializePublicData } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user && players.length === 0) {
      initializePublicData();
    }
  }, [user, players.length]);

  const completed = useMemo(() => matchDays.filter((m) => m.status === "completed"), [matchDays]);
  const sortedPlayers = useMemo(() => {
    const active = [...players].filter((p) => !p.archived);
    return active.sort((a, b) => {
      for (const { key, dir } of sortFields) {
        const aVal = statFields[key]?.get(a) ?? 0;
        const bVal = statFields[key]?.get(b) ?? 0;
        if (aVal !== bVal) return dir === "desc" ? bVal - aVal : aVal - bVal;
      }
      return 0;
    });
  }, [players, sortFields]);

  const toggleSortKey = (key) => {
    setSortFields((prev) => {
      const existing = prev.find((item) => item.key === key);
      if (!existing) {
        return [{ key, dir: key === "losses" ? "asc" : "desc" }, ...prev.slice(0, 3)];
      }
      if (existing.dir === "desc") {
        return prev.map((item) => item.key === key ? { ...item, dir: "asc" } : item);
      }
      const removed = prev.filter((item) => item.key !== key);
      return removed.length
        ? removed
        : [{ key: "points", dir: "desc" }, { key: "total_goals", dir: "desc" }, { key: "wins", dir: "desc" }, { key: "losses", dir: "asc" }];
    });
  };

  const thClass = (key) => {
    const active = sortFields.some((f) => f.key === key);
    return `cursor-pointer px-2 py-2 text-xs uppercase tracking-wider select-none transition-colors ${
      active ? "text-ink font-bold" : "text-ink-secondary font-semibold"
    }`;
  };

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-4xl font-black uppercase tracking-tight text-ink">Stats</h2>
        <span className="text-xs font-semibold uppercase tracking-wider text-ink-secondary">Sansiro FC</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          className={tab === "leaderboard" ? "btn-primary" : "btn-muted"}
          onClick={() => setTab("leaderboard")}
        >
          LEADERBOARD
        </button>
        <button
          className={tab === "history" ? "btn-primary" : "btn-muted"}
          onClick={() => setTab("history")}
        >
          MATCH HISTORY
        </button>
      </div>

      {tab === "leaderboard" && (
        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-2 border-b border-border bg-surface">
            <p className="text-xs text-ink-secondary">
              Sorted by:{" "}
              {sortFields.map((f) => `${statFields[f.key]?.label || f.key} ${f.dir === "desc" ? "↓" : "↑"}`).join(" · ")}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-3 py-2 text-xs uppercase tracking-wider text-ink-secondary font-semibold text-left">#</th>
                  <th className="px-3 py-2 text-xs uppercase tracking-wider text-ink-secondary font-semibold text-left">Player</th>
                  <th className="px-2 py-2 text-xs uppercase tracking-wider text-ink-secondary font-semibold">MP</th>
                  <th className={thClass("points")} onClick={() => toggleSortKey("points")}>Pts</th>
                  <th className={thClass("total_goals")} onClick={() => toggleSortKey("total_goals")}>GF</th>
                  <th className={thClass("total_conceded")} onClick={() => toggleSortKey("total_conceded")}>GA</th>
                  <th className={thClass("goalDiff")} onClick={() => toggleSortKey("goalDiff")}>GD</th>
                  <th className={thClass("wins")} onClick={() => toggleSortKey("wins")}>W</th>
                  <th className={thClass("draws")} onClick={() => toggleSortKey("draws")}>D</th>
                  <th className={thClass("losses")} onClick={() => toggleSortKey("losses")}>L</th>
                </tr>
              </thead>
              <tbody>
                {sortedPlayers.length === 0 && (
                  <tr>
                    <td colSpan={10} className="text-center py-8 text-ink-secondary text-sm">
                      No player data yet.
                    </td>
                  </tr>
                )}
                {sortedPlayers.map((p, i) => {
                  const rowBg =
                    i === 0 ? "bg-live/5" :
                    i === 1 ? "bg-surface" :
                    "bg-white";
                  return (
                    <tr key={p.id} className={`${rowBg} border-b border-border last:border-0`}>
                      <td className="px-3 py-2.5 font-black text-ink">{i + 1}</td>
                      <td className="px-3 py-2.5 font-semibold text-ink">{p.name}</td>
                      <td className="px-2 py-2.5 text-ink-secondary tabular-nums text-center">{p.matches_played}</td>
                      <td className="px-2 py-2.5 font-bold text-ink tabular-nums text-center">{p.points}</td>
                      <td className="px-2 py-2.5 text-ink-secondary tabular-nums text-center">{p.total_goals}</td>
                      <td className="px-2 py-2.5 text-ink-secondary tabular-nums text-center">{p.total_conceded}</td>
                      <td className="px-2 py-2.5 text-ink-secondary tabular-nums text-center">{p.total_goals - p.total_conceded}</td>
                      <td className="px-2 py-2.5 text-ink-secondary tabular-nums text-center">{p.wins}</td>
                      <td className="px-2 py-2.5 text-ink-secondary tabular-nums text-center">{p.draws}</td>
                      <td className="px-2 py-2.5 text-ink-secondary tabular-nums text-center">{p.losses}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "history" && (
        <div className="space-y-2">
          {completed.length === 0 ? (
            <div className="card text-sm text-ink-secondary text-center py-8">
              No completed matches yet.
            </div>
          ) : (
            completed.map((m) => (
              <button
                key={m.id}
                className="card w-full text-left hover:border-ink transition-colors"
                onClick={() => navigate(`/match/${m.id}`)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ink">{formatMatchDate(m.date)}</span>
                  <span className="font-black text-2xl text-ink tabular-nums">
                    {m.scoreA ?? m.score_a} – {m.scoreB ?? m.score_b}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-ink-secondary">
                  {m.asideSize || m.aside_size}-aside
                </p>
              </button>
            ))
          )}
        </div>
      )}
    </section>
  );
}
