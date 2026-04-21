import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";

export default function ScoreEntry() {
  const navigate = useNavigate();
  const { activeMatchId, matchDays, players, submitScore } = useStore();
  const match = matchDays.find((m) => m.id === activeMatchId);
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [scorers, setScorers] = useState({});
  const [assists, setAssists] = useState({});
  const playerMap = useMemo(() => Object.fromEntries(players.map((p) => [p.id, p])), [players]);

  if (!match) return <div className="card text-ink-secondary">No active match.</div>;

  const teamA = match.team_a || match.teamA || [];
  const teamB = match.team_b || match.teamB || [];
  const subsA = match.substitutes_a || match.substitutesA || [];
  const subsB = match.substitutes_b || match.substitutesB || [];
  const allPlayers = [...teamA, ...teamB, ...subsA, ...subsB];

  const totalScorerGoals = Object.values(scorers).reduce((a, b) => a + b, 0);
  const scoreTotal = Number(scoreA) + Number(scoreB);

  const adjustScorers = (id, delta) =>
    setScorers((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) + delta) }));
  const adjustAssists = (id, delta) =>
    setAssists((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) + delta) }));

  const getTeamLabel = (id) => {
    if (subsA.includes(id)) return { text: "SUB A", live: true };
    if (subsB.includes(id)) return { text: "SUB B", live: true };
    if (teamA.includes(id)) return { text: "A", live: false };
    return { text: "B", live: false };
  };

  const handleSubmit = async () => {
    const goalScorers = Object.entries(scorers)
      .filter(([, count]) => count > 0)
      .map(([playerId, count]) => ({ playerId, count }));

    const assistList = Object.entries(assists)
      .filter(([, count]) => count > 0)
      .map(([playerId, count]) => ({ playerId, count }));

    await submitScore(match.id, Number(scoreA), Number(scoreB), goalScorers, assistList);
    navigate("/stats");
  };

  const counterBtnClass = "h-9 w-9 rounded-xl border border-border bg-surface hover:bg-[#F4F4F5] font-bold text-ink transition-colors flex items-center justify-center";

  const PlayerRow = ({ id, value, onAdjust }) => {
    const label = getTeamLabel(id);
    return (
      <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${label.live ? "text-live bg-live/10" : "text-ink-secondary bg-surface border border-border"}`}>
            {label.text}
          </span>
          <span className="text-sm font-medium text-ink truncate">{playerMap[id]?.name || "Unknown"}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => onAdjust(id, -1)} className={counterBtnClass}>−</button>
          <span className="min-w-[1.5rem] text-center font-bold text-ink tabular-nums">{value || 0}</span>
          <button onClick={() => onAdjust(id, 1)} className={counterBtnClass}>+</button>
        </div>
      </div>
    );
  };

  return (
    <section className="space-y-4">
      <h2 className="text-4xl font-black uppercase tracking-tight text-ink">Score Entry</h2>

      <div className="card">
        <p className="text-xs font-bold uppercase tracking-wider text-ink-secondary mb-3">Final Score</p>
        <div className="flex items-center gap-3">
          <div className="flex-1 text-center">
            <p className="text-xs font-semibold text-ink-secondary mb-1">TEAM A</p>
            <input
              type="number"
              min="0"
              value={scoreA}
              onChange={(e) => setScoreA(e.target.value)}
              className="w-full min-h-14 rounded-xl border border-border bg-surface px-3 text-center text-3xl font-black text-ink outline-none focus:border-ink focus:ring-1 focus:ring-ink"
            />
          </div>
          <span className="text-xl font-black text-ink-secondary">–</span>
          <div className="flex-1 text-center">
            <p className="text-xs font-semibold text-ink-secondary mb-1">TEAM B</p>
            <input
              type="number"
              min="0"
              value={scoreB}
              onChange={(e) => setScoreB(e.target.value)}
              className="w-full min-h-14 rounded-xl border border-border bg-surface px-3 text-center text-3xl font-black text-ink outline-none focus:border-ink focus:ring-1 focus:ring-ink"
            />
          </div>
        </div>
      </div>

      <div className="card space-y-1">
        <p className="text-xs font-bold uppercase tracking-wider text-ink-secondary mb-2">Goal Scorers</p>
        {allPlayers.map((id) => (
          <PlayerRow key={id} id={id} value={scorers[id]} onAdjust={adjustScorers} />
        ))}
        {totalScorerGoals > scoreTotal && (
          <p className="text-xs text-live pt-1">
            Warning: scorer totals ({totalScorerGoals}) exceed final score total ({scoreTotal}).
          </p>
        )}
      </div>

      <div className="card space-y-1">
        <p className="text-xs font-bold uppercase tracking-wider text-ink-secondary mb-2">Assists</p>
        {allPlayers.map((id) => (
          <PlayerRow key={id} id={id} value={assists[id]} onAdjust={adjustAssists} />
        ))}
      </div>

      <button className="btn-primary" onClick={handleSubmit}>
        SUBMIT RESULT
      </button>
    </section>
  );
}
