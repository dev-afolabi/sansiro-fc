import { useEffect, useMemo, useState } from "react";
import { useStore } from "../store/useStore";
import { useAuth } from "../contexts/AuthContext";

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

function BarChart({ players, getValue, emptyText }) {
  const ranked = useMemo(
    () =>
      [...players]
        .filter((p) => !p.archived && getValue(p) > 0)
        .sort((a, b) => getValue(b) - getValue(a)),
    [players, getValue]
  );

  const max = ranked[0] ? getValue(ranked[0]) : 1;

  if (ranked.length === 0) {
    return (
      <div className="card text-sm text-ink-secondary text-center py-8">{emptyText}</div>
    );
  }

  return (
    <div className="card p-0 overflow-hidden">
      <div className="divide-y divide-border">
        {ranked.map((p, i) => {
          const value = getValue(p);
          const pct = Math.max(4, (value / max) * 100);
          const isTop = i === 0;
          const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;

          return (
            <div
              key={p.id}
              className={`flex items-center gap-3 px-4 py-3 ${isTop ? "bg-live/5" : ""}`}
            >
              <span className="w-6 text-xs font-black text-ink-secondary text-right shrink-0">
                {medal ?? i + 1}
              </span>
              <span className="w-[90px] text-sm font-semibold text-ink truncate shrink-0">
                {p.name}
              </span>
              <div className="flex-1 h-4 rounded-full bg-surface border border-border overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${isTop ? "bg-live" : "bg-ink"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-7 text-sm font-black text-ink tabular-nums text-right shrink-0">
                {value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Stats() {
  const [tab, setTab] = useState("leaderboard");
  const [sortFields, setSortFields] = useState([
    { key: "points", dir: "desc" },
    { key: "total_goals", dir: "desc" },
    { key: "wins", dir: "desc" },
    { key: "losses", dir: "asc" },
  ]);
  const { user } = useAuth();
  const { players, initializePublicData } = useStore();

  useEffect(() => {
    if (!user && players.length === 0) {
      initializePublicData();
    }
  }, [user, players.length]);

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

  const tabs = [
    { key: "leaderboard", label: "TABLE" },
    { key: "scorers",     label: "SCORERS" },
    { key: "assists",     label: "ASSISTS" },
  ];

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-4xl font-black uppercase tracking-tight text-ink">Stats</h2>
        <span className="text-xs font-semibold uppercase tracking-wider text-ink-secondary">Sansiro FC</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            className={tab === key ? "btn-primary" : "btn-muted"}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
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
            <table className="min-w-full text-sm">
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
                      <td className="px-3 py-2.5 font-semibold text-ink max-w-[110px]"><span className="block truncate">{p.name}</span></td>
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

      {tab === "scorers" && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-secondary">Top Goal Scorers</p>
            <span className="text-xs text-ink-secondary">{players.filter(p => !p.archived && p.total_goals > 0).length} players</span>
          </div>
          <BarChart
            players={players}
            getValue={(p) => p.total_goals}
            emptyText="No goals recorded yet."
          />
        </>
      )}

      {tab === "assists" && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-secondary">Assist Kings</p>
            <span className="text-xs text-ink-secondary">{players.filter(p => !p.archived && p.total_assists > 0).length} players</span>
          </div>
          <BarChart
            players={players}
            getValue={(p) => p.total_assists}
            emptyText="No assists recorded yet."
          />
        </>
      )}
    </section>
  );
}
