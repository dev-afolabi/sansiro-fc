import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ShuffleAnimation from "../components/ShuffleAnimation";
import TeamCard from "../components/TeamCard";
import { useStore } from "../store/useStore";

function SubAdder({ team, value, onChange, players, allAssigned, onAdd }) {
  const filtered = players.filter(
    (p) => !p.archived && !allAssigned.has(p.id) && (value === "" || p.name.toLowerCase().includes(value.toLowerCase()))
  );
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-ink-secondary">
        Add Sub — Team {team}
      </p>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Player name"
        className="w-full min-h-10 rounded-xl border border-border bg-surface px-3 text-sm text-ink placeholder:text-ink-secondary outline-none focus:border-ink transition"
        list={`sub-list-${team}`}
      />
      <datalist id={`sub-list-${team}`}>
        {filtered.map((p) => <option key={p.id} value={p.name} />)}
      </datalist>
      <button
        onClick={() => onAdd(team, value)}
        className="w-full min-h-9 rounded-xl bg-[#F4F4F5] text-sm font-semibold text-ink-muted hover:bg-[#EBEBEB] transition-colors"
      >
        + Add Sub
      </button>
    </div>
  );
}

export default function Teams() {
  const navigate = useNavigate();
  const [subInputA, setSubInputA] = useState("");
  const [subInputB, setSubInputB] = useState("");
  const { activeMatchId, matchDays, players, randomizeTeams, addSubstitute, removeSubstitute, createPlayer } = useStore();
  const match = matchDays.find((m) => m.id === activeMatchId);
  const playerMap = useMemo(() => Object.fromEntries(players.map((p) => [p.id, p])), [players]);

  const teamsPreset = (match?.teamA?.length > 0) || (match?.teamB?.length > 0);
  const [showShuffle, setShowShuffle] = useState(!teamsPreset);

  useEffect(() => {
    if (!match) return;
    if (!match.teamA?.length && !match.teamB?.length) {
      randomizeTeams(match.id);
      const timer = setTimeout(() => setShowShuffle(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [match?.id]);

  if (!match) return <div className="card text-ink-secondary">No active match.</div>;
  if (showShuffle) return <ShuffleAnimation />;

  const teamAIds = match.teamA || [];
  const teamBIds = match.teamB || [];
  const subsA = match.substitutesA || [];
  const subsB = match.substitutesB || [];
  const allAssigned = new Set([...teamAIds, ...teamBIds, ...subsA, ...subsB]);

  const handleAddSub = async (team, name) => {
    if (!name.trim()) return;
    const existing = players.find((p) => p.name.toLowerCase() === name.trim().toLowerCase());
    let playerId = existing?.id;
    if (!playerId) playerId = await createPlayer(name.trim());
    if (!playerId) return;
    await addSubstitute(match.id, team, playerId);
    if (team === "A") setSubInputA(""); else setSubInputB("");
  };

  return (
    <section className="space-y-4">
      <h2 className="text-4xl font-black uppercase tracking-tight text-ink">Teams</h2>

      <div className="flex gap-3">
        <TeamCard
          title="TEAM A"
          accentClass="text-ink"
          players={teamAIds}
          backmanId={match.backmanA}
          subs={subsA}
          playerMap={playerMap}
          onRemoveSub={(id) => removeSubstitute(match.id, "A", id)}
        />
        <TeamCard
          title="TEAM B"
          accentClass="text-ink-secondary"
          players={teamBIds}
          backmanId={match.backmanB}
          subs={subsB}
          playerMap={playerMap}
          onRemoveSub={(id) => removeSubstitute(match.id, "B", id)}
        />
      </div>

      <div className="card space-y-4">
        <SubAdder team="A" value={subInputA} onChange={setSubInputA} players={players} allAssigned={allAssigned} onAdd={handleAddSub} />
        <div className="border-t border-border" />
        <SubAdder team="B" value={subInputB} onChange={setSubInputB} players={players} allAssigned={allAssigned} onAdd={handleAddSub} />
      </div>

      <button className="btn-primary" onClick={() => navigate("/score")}>
        PLAY MATCH
      </button>
    </section>
  );
}
