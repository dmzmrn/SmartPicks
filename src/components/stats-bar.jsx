import { combinations, formatBigInt } from "@/lib/stats";

const TICKET_PRICE = "₱25";

const Stat = ({ label, value, hint }) => (
  <div className="space-y-1 bg-card px-5 py-4">
    <div className="text-xs font-medium text-muted-foreground">{label}</div>
    <div className="text-lg font-semibold tabular-nums tracking-tight">{value}</div>
    <div className="text-xs text-muted-foreground">{hint}</div>
  </div>
);

export default function StatsBar({ pick, max, excludedCount }) {
  const odds = combinations(max, pick);

  return (
    <div className="grid gap-px overflow-hidden rounded-lg border bg-border shadow-sm sm:grid-cols-3">
      <Stat label="Jackpot odds" value={`1 in ${formatBigInt(odds)}`} hint="the same for every combination" />
      <Stat label="Ticket price" value={TICKET_PRICE} hint="per combination" />
      <Stat
        label="Excluded combinations"
        value={excludedCount.toLocaleString()}
        hint="stored for this game"
      />
    </div>
  );
}
