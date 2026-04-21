export default function PlayerCard({ player, badge, onRemove, locked = false }) {
  return (
    <div className="card flex items-center justify-between py-3">
      <div className="flex items-center gap-2 min-w-0">
        <span className="h-8 w-8 rounded-full bg-surface border border-border grid place-items-center text-sm font-bold text-ink shrink-0">
          {player.name[0]?.toUpperCase()}
        </span>
        <span className="font-medium truncate">{player.name}</span>
        {badge ? (
          <span className="text-xs font-semibold text-ink-secondary shrink-0">{badge}</span>
        ) : null}
      </div>
      {onRemove ? (
        <button
          disabled={locked}
          onClick={onRemove}
          className="text-sm text-ink-secondary hover:text-live disabled:opacity-30 transition-colors shrink-0 ml-2"
        >
          Remove
        </button>
      ) : null}
    </div>
  );
}
