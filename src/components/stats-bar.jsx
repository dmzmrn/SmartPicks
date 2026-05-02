import { Card, CardContent } from "@/components/ui/card";
import { combinations, formatBigInt } from "@/lib/stats";

const Stat = ({ label, value, sub }) => (
  <Card>
    <CardContent className="space-y-1 p-4">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="font-display text-lg accent-text-soft">{value}</div>
      {sub && <div className="text-[11px] text-slate-500">{sub}</div>}
    </CardContent>
  </Card>
);

export default function StatsBar({ pick, max, excludedCount }) {
  const odds = combinations(max, pick);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Stat label="Jackpot odds" value={`1 in ${formatBigInt(odds)}`} sub={`C(${max}, ${pick})`} />
      <Stat label="Excluded combos" value={excludedCount} sub={excludedCount === 1 ? "stored" : "stored"} />
      <Stat label="Ticket price" value="₱25" sub="per combination" />
    </div>
  );
}
