import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";

const sizes = [8, 9, 10];

const inputClass =
  "w-full min-h-11 rounded-xl border border-border bg-surface px-3 text-base text-ink placeholder:text-ink-secondary outline-none focus:border-ink focus:ring-1 focus:ring-ink transition";

export default function Setup() {
  const navigate = useNavigate();
  const {
    activeMatchId,
    matchDays,
    players,
    createMatchDay,
    updateAsideSize,
    setBackman,
    createPlayer,
    updateMatchDate,
  } = useStore();
  const match = useMemo(() => matchDays.find((m) => m.id === activeMatchId), [matchDays, activeMatchId]);
  const options = players.filter((p) => !p.archived);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    await createMatchDay(8);
    setCreating(false);
  };

  if (!match) {
    return (
      <section className="space-y-4 py-4">
        <h2 className="text-4xl font-black uppercase tracking-tight text-ink">New Match Day</h2>
        <p className="text-sm text-ink-secondary">No active match. Start one to begin setting up your teams.</p>
        <button onClick={handleCreate} disabled={creating} className="btn-primary">
          {creating ? "Creating..." : "+ NEW MATCH DAY"}
        </button>
      </section>
    );
  }

  const handleBackman = async (team, value) => {
    if (!value.trim()) return;
    const existing = options.find((p) => p.id === value || p.name.toLowerCase() === value.trim().toLowerCase());
    if (existing) {
      setBackman(match.id, team, existing.id);
    } else {
      const id = await createPlayer(value.trim());
      if (id) setBackman(match.id, team, id);
    }
  };

  const currentSize = match.asideSize || match.aside_size;
  const backmanAName = options.find((p) => p.id === match.backmanA)?.name || "";
  const backmanBName = options.find((p) => p.id === match.backmanB)?.name || "";

  return (
    <section className="space-y-4">
      <h2 className="text-4xl font-black uppercase tracking-tight text-ink">Setup</h2>

      <div className="card space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-ink-secondary">Match Date</p>
        <input
          type="date"
          value={match.date?.slice(0, 10) || ""}
          onChange={(e) => updateMatchDate(match.id, e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="card space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-ink-secondary">Match Format</p>
        <div className="grid grid-cols-3 gap-2">
          {sizes.map((size) => (
            <button
              key={size}
              className={`min-h-11 rounded-xl font-bold tracking-wide transition-colors ${
                currentSize === size
                  ? "bg-ink text-white"
                  : "bg-[#F4F4F5] text-ink-muted hover:bg-[#EBEBEB]"
              }`}
              onClick={() => updateAsideSize(match.id, size)}
            >
              {size}-ASIDE
            </button>
          ))}
        </div>
      </div>

      <div className="card space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-ink-secondary">Backmen (Goalkeepers)</p>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-ink">Team A Goalkeeper</label>
          <input
            list="players-a"
            placeholder="Search or add player name"
            defaultValue={backmanAName}
            key={`a-${match.backmanA}`}
            className={inputClass}
            onBlur={(e) => handleBackman("A", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-ink">Team B Goalkeeper</label>
          <input
            list="players-b"
            placeholder="Search or add player name"
            defaultValue={backmanBName}
            key={`b-${match.backmanB}`}
            className={inputClass}
            onBlur={(e) => handleBackman("B", e.target.value)}
          />
        </div>
        <datalist id="players-a">
          {options.filter((p) => p.id !== match.backmanB).map((p) => (
            <option key={p.id} value={p.name} />
          ))}
        </datalist>
        <datalist id="players-b">
          {options.filter((p) => p.id !== match.backmanA).map((p) => (
            <option key={p.id} value={p.name} />
          ))}
        </datalist>

        {match.backmanA && (
          <p className="text-xs text-ink-secondary">
            ✓ Team A: <span className="font-semibold text-ink">{backmanAName}</span>
          </p>
        )}
        {match.backmanB && (
          <p className="text-xs text-ink-secondary">
            ✓ Team B: <span className="font-semibold text-ink">{backmanBName}</span>
          </p>
        )}
      </div>

      <button
        className={!match.backmanA || !match.backmanB ? "btn-muted" : "btn-primary"}
        disabled={!match.backmanA || !match.backmanB}
        onClick={() => navigate("/teamsheet")}
      >
        CONTINUE TO TEAMSHEET
      </button>
    </section>
  );
}
