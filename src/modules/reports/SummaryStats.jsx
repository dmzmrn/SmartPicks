import { Card, CardContent } from "@/components/ui/card";

const Stat = ({ label, value, hint }) => (
  <Card>
    <CardContent className="space-y-1 p-4">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="font-display text-xl accent-text-soft">{value}</div>
      {hint && <div className="text-[11px] text-slate-500">{hint}</div>}
    </CardContent>
  </Card>
);

export default function SummaryStats({ aggregate }) {
  const {
    totalDraws,
    meanSum,
    stddevSum,
    minSum,
    maxSum,
    hottest,
    coldest,
    hottestCount,
    coldestCount,
    modeOddEven,
  } = aggregate;

  const fmt = (n) => (Number.isFinite(n) ? n.toFixed(0) : "—");
  const fmtList = (arr) =>
    arr.length === 0 ? "—" : arr.slice(0, 4).map((n) => String(n).padStart(2, "0")).join(", ") + (arr.length > 4 ? "…" : "");

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      <Stat label="Total draws" value={totalDraws} />
      <Stat label="Mean sum" value={fmt(meanSum)} hint={`σ ${stddevSum.toFixed(1)}`} />
      <Stat label="Sum range" value={`${minSum}–${maxSum}`} />
      <Stat
        label="Hottest"
        value={fmtList(hottest)}
        hint={`${hottestCount}× drawn`}
      />
      <Stat
        label="Coldest"
        value={fmtList(coldest)}
        hint={`${coldestCount}× drawn`}
      />
      <Stat label="Mode O/E" value={modeOddEven} />
    </div>
  );
}
