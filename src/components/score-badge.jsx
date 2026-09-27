export default function ScoreBadge({ score, label }) {
  return (
    <div
      className="w-24 shrink-0 space-y-1.5"
      title={`Less crowded than ${score}% of all possible combinations. Not a prediction — every combination has the same chance of being drawn.`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-lg font-semibold leading-none tabular-nums">{score}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div
        role="meter"
        aria-label="Crowd score"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={score}
        className="h-1 overflow-hidden rounded-full bg-muted"
      >
        <div className="h-full rounded-full bg-primary" style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}
