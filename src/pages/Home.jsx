import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../components/Modal";
import { useStore } from "../store/useStore";
import { useAuth } from "../contexts/AuthContext";
import { formatMatchDate } from "../utils/date";

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { matchDays, activeMatchId, createMatchDay, initializeData, initializePublicData } = useStore();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const active = matchDays.find((m) => m.id === activeMatchId && m.status !== "completed");

  useEffect(() => {
    if (user) {
      initializeData().finally(() => setLoading(false));
    } else {
      initializePublicData().finally(() => setLoading(false));
    }
  }, [user]);

  const resumePath = useMemo(() => {
    if (!active) return "/setup";
    if (active.status === "setup") return "/setup";
    if (active.status === "teamsheet") return "/teamsheet";
    if (active.status === "teams") return "/teams";
    return "/score";
  }, [active]);

  const handleNew = async () => {
    if (active) return setShowConfirm(true);
    setCreating(true);
    const matchId = await createMatchDay(8);
    setCreating(false);
    if (matchId) navigate("/setup");
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-ink-secondary text-base font-medium">Loading...</div>
      </div>
    );
  }

  const completedMatches = matchDays.filter((m) => m.status === "completed");
  const pendingMatches = matchDays.filter((m) => m.status !== "completed");

  return (
    <section className="space-y-5 py-2">
      <header className="space-y-0.5">
        <h1 className="text-5xl font-black uppercase tracking-tight text-ink leading-none">
          SANSIRO FC
        </h1>
        <p className="text-sm text-ink-secondary">{new Date().toDateString()}</p>
      </header>

      {!user && (
        <div className="card flex items-center justify-between">
          <p className="text-sm text-ink-secondary">Public view — results &amp; stats only</p>
          <button
            onClick={() => navigate("/login")}
            className="text-sm font-semibold text-ink hover:text-ink-secondary transition-colors"
          >
            Sign In →
          </button>
        </div>
      )}

      {user && active && (
        <button
          onClick={() => navigate(resumePath)}
          className="card w-full text-left border-live/40 bg-live/5 hover:bg-live/10 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-live">Active Match</p>
              <p className="font-semibold text-ink mt-0.5">
                {formatMatchDate(active.date)} — {active.asideSize || active.aside_size}-aside
              </p>
            </div>
            <span className="text-sm font-bold text-live">RESUME →</span>
          </div>
        </button>
      )}

      {matchDays.length === 0 && (
        <div className="card text-sm text-ink-secondary text-center py-8">
          {user ? "No matches yet. Start your first match day above." : "No completed matches to display yet."}
        </div>
      )}

      {user && pendingMatches.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-secondary">In Progress</p>
          {pendingMatches.map((m) => (
            <button
              key={m.id}
              className="card w-full text-left hover:border-ink transition-colors"
              onClick={() => navigate(`/match/${m.id}`)}
            >
              <div className="flex justify-between items-start">
                <span className="font-semibold text-ink">{formatMatchDate(m.date)}</span>
                <span className="text-xs font-bold uppercase text-ink-secondary bg-surface border border-border px-2 py-0.5 rounded-full">
                  {m.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-ink-secondary">
                {m.asideSize || m.aside_size}-aside
              </p>
            </button>
          ))}
        </div>
      )}

      {completedMatches.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-secondary">Recent Results</p>
          {completedMatches.slice(0, 10).map((m) => (
            <button
              key={m.id}
              className="card w-full text-left hover:border-ink transition-colors"
              onClick={() => navigate(`/match/${m.id}`)}
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold text-ink">{formatMatchDate(m.date)}</span>
                <span className="font-black text-xl text-ink tabular-nums">
                  {m.scoreA ?? m.score_a} – {m.scoreB ?? m.score_b}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-ink-secondary">
                {m.asideSize || m.aside_size}-aside
              </p>
            </button>
          ))}
        </div>
      )}

      <Modal isOpen={showConfirm} onClose={() => setShowConfirm(false)} title="Active Match Exists">
        <p className="text-sm text-ink-secondary mb-4">
          Finish or resume your current match before creating another one.
        </p>
        <button onClick={() => setShowConfirm(false)} className="btn-primary">
          Got it
        </button>
      </Modal>
    </section>
  );
}
