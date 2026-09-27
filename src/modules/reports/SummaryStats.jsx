const Stat = ({ label, value, hint }) => (
  <div className="space-y-1 bg-card px-5 py-4">
    <div className="text-xs font-medium text-muted-foreground">{label}</div>
    <div className="text-xl font-semibold tabular-nums tracking-tight">{value}</div>
    {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
  </div>
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
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border shadow-sm md:grid-cols-3 xl:grid-cols-6">
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
      <Stat label="Most common odd/even" value={modeOddEven} />
    </div>
  );
}
