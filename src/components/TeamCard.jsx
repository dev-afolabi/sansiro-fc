export default function TeamCard({
  title,
  accentClass = "text-ink",
  players = [],
  backmanId,
  subs = [],
  playerMap = {},
  onRemoveSub,
}) {
  return (
    <div className="card flex-1 min-w-0">
      <h3 className={`text-lg font-black uppercase tracking-tight ${accentClass}`}>{title}</h3>
      <ul className="mt-2 space-y-1.5">
        {players.map((id) => (
          <li
            key={id}
            className="rounded-lg bg-surface border border-border px-3 py-2 text-sm flex items-center gap-2"
          >
            {id === backmanId && (
              <span className="text-[10px] font-bold uppercase text-ink-secondary shrink-0">GK</span>
            )}
            <span className="truncate">{playerMap[id]?.name || "Unknown"}</span>
          </li>
        ))}
      </ul>

      {subs.length > 0 && (
        <>
          <p className="mt-3 text-[10px] font-bold uppercase text-ink-secondary tracking-wider">Subs</p>
          <ul className="mt-1.5 space-y-1.5">
            {subs.map((id) => (
              <li
                key={id}
                className="rounded-lg bg-surface border border-live/30 px-3 py-2 text-sm flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] font-bold uppercase text-live bg-live/10 px-1.5 py-0.5 rounded shrink-0">
                    SUB
                  </span>
                  <span className="truncate">{playerMap[id]?.name || "Unknown"}</span>
                </div>
                {onRemoveSub && (
                  <button
                    onClick={() => onRemoveSub(id)}
                    className="text-xs text-ink-secondary hover:text-live transition-colors shrink-0"
                    aria-label="Remove substitute"
                  >
                    ✕
                  </button>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
