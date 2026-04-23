import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import { useAuth } from "../contexts/AuthContext";
import { formatMatchDate } from "../utils/date";

export default function MatchDetails() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { matchDays, players, initializePublicData, deleteMatchDay } = useStore();
  const playerMap = useMemo(() => Object.fromEntries(players.map((p) => [p.id, p])), [players]);
  const match = matchDays.find((m) => m.id === matchId);

  useEffect(() => {
    if (!user && matchDays.length === 0) {
      initializePublicData();
    }
  }, [user, matchDays.length]);

  if (!match) {
    return (
      <div className="card text-center py-8 space-y-3">
        <p className="text-ink-secondary text-sm">Match not found.</p>
        <button onClick={() => navigate(-1)} className="btn-ghost">Go back</button>
      </div>
    );
  }

  const subsA = match.substitutesA || match.substitutes_a || [];
  const subsB = match.substitutesB || match.substitutes_b || [];
  const isCompleted = match.status === "completed";

  const PlayerRow = ({ id, isGK, isSub }) => (
    <li className="flex items-center gap-2 py-1.5 border-b border-border last:border-0 text-sm">
      {isGK && <span className="text-[10px] font-bold text-ink-secondary bg-surface border border-border px-1.5 py-0.5 rounded shrink-0">GK</span>}
      {isSub && <span className="text-[10px] font-bold text-live bg-live/10 px-1.5 py-0.5 rounded shrink-0">SUB</span>}
      <span className={`${isGK || isSub ? "" : "ml-[calc(10px+0.375rem+1ch)]"} font-medium text-ink`}>
        {playerMap[id]?.name || "Unknown"}
      </span>
    </li>
  );

  const handleDelete = async () => {
    setDeleting(true);
    await deleteMatchDay(matchId);
    navigate("/", { replace: true });
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="text-sm text-ink-secondary hover:text-ink transition-colors">
          ← Back
        </button>
        {user && !confirmDelete && (
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-sm font-semibold text-live hover:text-live/70 transition-colors"
          >
            Delete
          </button>
        )}
        {user && confirmDelete && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-secondary">Are you sure?</span>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-xs font-semibold text-ink-secondary hover:text-ink transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-xs font-bold text-white bg-live px-2.5 py-1 rounded-lg disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Confirm"}
            </button>
          </div>
        )}
      </div>

      <h2 className="text-4xl font-black uppercase tracking-tight text-ink">Match Details</h2>

      <div className="card space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-ink">{formatMatchDate(match.date)}</p>
            <p className="text-sm text-ink-secondary">{match.asideSize || match.aside_size}-aside</p>
          </div>
          <span className={`text-xs font-bold uppercase px-2 py-1 rounded-full shrink-0 ${
            isCompleted
              ? "bg-surface text-ink-secondary border border-border"
              : "bg-live/10 text-live"
          }`}>
            {match.status}
          </span>
        </div>

        {isCompleted ? (
          <div className="flex items-center justify-center gap-4 py-3">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase text-ink-secondary">Team A</p>
              <p className="text-5xl font-black text-ink tabular-nums">{match.scoreA ?? match.score_a}</p>
            </div>
            <span className="text-2xl font-black text-ink-secondary">–</span>
            <div className="text-center">
              <p className="text-xs font-semibold uppercase text-ink-secondary">Team B</p>
              <p className="text-5xl font-black text-ink tabular-nums">{match.scoreB ?? match.score_b}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-ink-secondary">Result pending</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="card">
          <h3 className="text-base font-black uppercase tracking-tight text-ink">Team A</h3>
          <ul className="mt-2">
            {match.teamA.map((id) => (
              <PlayerRow key={id} id={id} isGK={id === match.backmanA} isSub={false} />
            ))}
            {subsA.map((id) => (
              <PlayerRow key={id} id={id} isGK={false} isSub={true} />
            ))}
          </ul>
        </div>

        <div className="card">
          <h3 className="text-base font-black uppercase tracking-tight text-ink-secondary">Team B</h3>
          <ul className="mt-2">
            {match.teamB.map((id) => (
              <PlayerRow key={id} id={id} isGK={id === match.backmanB} isSub={false} />
            ))}
            {subsB.map((id) => (
              <PlayerRow key={id} id={id} isGK={false} isSub={true} />
            ))}
          </ul>
        </div>
      </div>

      {isCompleted && match.goalScorers && match.goalScorers.length > 0 && (
        <div className="card">
          <h3 className="text-base font-black uppercase tracking-tight text-ink">Goal Scorers</h3>
          <ul className="mt-2 space-y-1">
            {match.goalScorers.map((s, i) => (
              <li key={`${s.playerId}-${i}`} className="flex items-center justify-between py-1.5 border-b border-border last:border-0 text-sm">
                <span className="font-medium text-ink">{playerMap[s.playerId]?.name || "Unknown"}</span>
                <span className="font-black text-ink tabular-nums">{s.count} ⚽</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isCompleted && match.assists && match.assists.length > 0 && (
        <div className="card">
          <h3 className="text-base font-black uppercase tracking-tight text-ink">Assists</h3>
          <ul className="mt-2 space-y-1">
            {match.assists.map((a, i) => (
              <li key={`${a.playerId}-${i}`} className="flex items-center justify-between py-1.5 border-b border-border last:border-0 text-sm">
                <span className="font-medium text-ink">{playerMap[a.playerId]?.name || "Unknown"}</span>
                <span className="font-black text-ink tabular-nums">{a.count} 🅰️</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
