import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PlayerCard from "../components/PlayerCard";
import { useStore } from "../store/useStore";

// assignment values: 'A' | 'B' | 'subA' | 'subB'
const ASSIGN_OPTIONS = [
  { value: "A",    label: "A" },
  { value: "B",    label: "B" },
  { value: "subA", label: "S·A" },
  { value: "subB", label: "S·B" },
];

export default function Teamsheet() {
  const navigate = useNavigate();
  const [entry, setEntry] = useState("");
  const [mode, setMode] = useState("random"); // 'random' | 'manual'
  const [assignments, setAssignments] = useState({});
  const [confirming, setConfirming] = useState(false);

  const {
    activeMatchId,
    matchDays,
    players,
    createPlayer,
    addPlayerToTeamsheet,
    removePlayerFromTeamsheet,
    setTeamsManually,
  } = useStore();

  const match = matchDays.find((m) => m.id === activeMatchId);
  const playerMap = useMemo(() => Object.fromEntries(players.map((p) => [p.id, p])), [players]);

  // Pre-assign backmen to their fixed teams whenever they change
  useEffect(() => {
    if (!match) return;
    setAssignments((prev) => {
      const next = { ...prev };
      if (match.backmanA) next[match.backmanA] = "A";
      if (match.backmanB) next[match.backmanB] = "B";
      return next;
    });
  }, [match?.backmanA, match?.backmanB]);

  const suggestions = useMemo(() => {
    if (!match) return [];
    const query = entry.trim().toLowerCase();
    if (!query) return [];
    return players
      .filter((p) => !p.archived && p.name.toLowerCase().includes(query))
      .filter((p) => !match.players.includes(p.id))
      .slice(0, 5);
  }, [entry, players, match]);

  if (!match) return <div className="card text-ink-secondary">No active match.</div>;

  const needed = (match.asideSize || match.aside_size) * 2;
  const count = match.players.length;
  const ready = count === needed;
  const progress = Math.min((count / needed) * 100, 100);

  const add = async () => {
    if (!entry.trim()) return;
    const existing = players.find((p) => p.name.toLowerCase() === entry.trim().toLowerCase());
    const id = existing ? existing.id : await createPlayer(entry.trim());
    if (id) addPlayerToTeamsheet(match.id, id);
    setEntry("");
  };

  const handleKey = (e) => {
    if (e.key === "Enter") { e.preventDefault(); add(); }
  };

  const assign = (playerId, value) => {
    const isBackman = playerId === match.backmanA || playerId === match.backmanB;
    if (isBackman) return; // locked
    setAssignments((prev) => ({
      ...prev,
      [playerId]: prev[playerId] === value ? undefined : value, // tap same = deselect
    }));
  };

  const allAssigned = match.players.length > 0 && match.players.every((id) => !!assignments[id]);

  const handleConfirmTeams = async () => {
    if (!allAssigned) return;
    setConfirming(true);
    const teamA  = match.players.filter((id) => assignments[id] === "A");
    const teamB  = match.players.filter((id) => assignments[id] === "B");
    const subsA  = match.players.filter((id) => assignments[id] === "subA");
    const subsB  = match.players.filter((id) => assignments[id] === "subB");
    await setTeamsManually(match.id, teamA, teamB, subsA, subsB);
    setConfirming(false);
    navigate("/teams");
  };

  return (
    <section className="space-y-4">
      <h2 className="text-4xl font-black uppercase tracking-tight text-ink">Teamsheet</h2>

      {/* Mode toggle */}
      <div className="grid grid-cols-2 gap-2">
        <button
          className={mode === "random" ? "btn-primary" : "btn-muted"}
          onClick={() => setMode("random")}
        >
          RANDOMIZE
        </button>
        <button
          className={mode === "manual" ? "btn-primary" : "btn-muted"}
          onClick={() => setMode("manual")}
        >
          MANUAL
        </button>
      </div>

      {/* Squad progress */}
      <div className="card space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-ink-secondary font-medium">
            {mode === "manual" ? "Squad" : "Squad"}
          </span>
          <span className={`font-black text-base ${ready ? "text-ink" : "text-ink-secondary"}`}>
            {count} / {needed}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-border overflow-hidden">
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${ready ? "bg-ink" : "bg-ink-secondary"}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Add player input */}
      <div className="card space-y-2">
        <input
          value={entry}
          onChange={(e) => setEntry(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Search or type player name"
          className="w-full min-h-11 rounded-xl border border-border bg-surface px-3 text-base text-ink placeholder:text-ink-secondary outline-none focus:border-ink focus:ring-1 focus:ring-ink transition"
        />
        {suggestions.length > 0 && (
          <div className="space-y-1">
            {suggestions.map((p) => (
              <button
                key={p.id}
                onClick={() => setEntry(p.name)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-left text-sm font-medium hover:bg-[#F4F4F5] transition-colors"
              >
                {p.name}
              </button>
            ))}
          </div>
        )}
        <button className="btn-primary" onClick={add}>
          + ADD PLAYER
        </button>
      </div>

      {/* ── RANDOMIZE MODE ── */}
      {mode === "random" && (
        <>
          <div className="space-y-2">
            {match.players.map((id) => {
              const p = playerMap[id];
              if (!p) return null;
              const isBackman = id === match.backmanA || id === match.backmanB;
              return (
                <PlayerCard
                  key={id}
                  player={p}
                  badge={isBackman ? "GK" : ""}
                  locked={isBackman}
                  onRemove={isBackman ? null : () => removePlayerFromTeamsheet(match.id, id)}
                />
              );
            })}
          </div>
          <button
            className={ready ? "btn-primary" : "btn-muted"}
            disabled={!ready}
            onClick={() => navigate("/teams")}
          >
            RANDOMIZE TEAMS
          </button>
        </>
      )}

      {/* ── MANUAL MODE ── */}
      {mode === "manual" && (
        <>
          {/* Legend */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs text-ink-secondary font-medium">Assign each player:</span>
            {ASSIGN_OPTIONS.map(({ value, label }) => (
              <span key={value} className="flex items-center gap-1 text-xs text-ink-secondary">
                <span className="inline-block w-7 text-center rounded-lg border border-border bg-surface py-0.5 font-bold text-ink text-[11px]">
                  {label}
                </span>
                {value === "A" ? "Team A" : value === "B" ? "Team B" : value === "subA" ? "Sub A" : "Sub B"}
              </span>
            ))}
          </div>

          {/* Assignment summary */}
          {count > 0 && (
            <div className="grid grid-cols-4 gap-1.5 text-center">
              {[
                { key: "A",    label: "Team A" },
                { key: "B",    label: "Team B" },
                { key: "subA", label: "Sub A" },
                { key: "subB", label: "Sub B" },
              ].map(({ key, label }) => {
                const n = match.players.filter((id) => assignments[id] === key).length;
                return (
                  <div key={key} className="card p-2">
                    <p className="text-[10px] font-bold uppercase text-ink-secondary">{label}</p>
                    <p className="text-xl font-black text-ink">{n}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Player list with assignment buttons */}
          <div className="space-y-2">
            {match.players.map((id) => {
              const p = playerMap[id];
              if (!p) return null;
              const isBackman = id === match.backmanA || id === match.backmanB;
              const current = assignments[id];

              return (
                <div key={id} className="card flex items-center justify-between gap-2 py-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="h-8 w-8 rounded-full bg-surface border border-border grid place-items-center text-sm font-bold text-ink shrink-0">
                      {p.name[0]?.toUpperCase()}
                    </span>
                    <span className="font-medium truncate text-ink">{p.name}</span>
                    {isBackman && (
                      <span className="text-xs font-semibold text-ink-secondary shrink-0">GK</span>
                    )}
                  </div>

                  {isBackman ? (
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg bg-ink text-white shrink-0`}>
                      {current === "A" ? "A" : "B"}
                    </span>
                  ) : (
                    <div className="flex gap-1 shrink-0">
                      {ASSIGN_OPTIONS.map(({ value, label }) => (
                        <button
                          key={value}
                          onClick={() => assign(id, value)}
                          className={`w-9 h-9 rounded-lg text-[11px] font-bold transition-colors ${
                            current === value
                              ? "bg-ink text-white"
                              : "bg-surface border border-border text-ink-secondary hover:bg-[#F4F4F5]"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {count === 0 && (
            <div className="card text-center py-6 text-sm text-ink-secondary">
              Add players above to start assigning teams.
            </div>
          )}

          <button
            className={allAssigned && !confirming ? "btn-primary" : "btn-muted"}
            disabled={!allAssigned || confirming}
            onClick={handleConfirmTeams}
          >
            {confirming ? "Saving..." : `CONFIRM TEAMS${allAssigned ? "" : ` (${match.players.filter(id => !assignments[id]).length} unassigned)`}`}
          </button>
        </>
      )}
    </section>
  );
}
