const Kpi = ({ label, value, hint }) => (
  <div className="space-y-1 bg-card px-5 py-4">
    <div className="text-xs font-medium text-muted-foreground">{label}</div>
    <div className="text-xl font-semibold tabular-nums tracking-tight">{value}</div>
    {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
  </div>
);

export default function KpiRow({ summary }) {
  const {
    totalRows,
    totalDraws,
    meanSum,
    theoreticalMean,
    window: sumWindow,
    meanSpread,
    minSpread,
    highShare,
    highBaseline,
    relaxedRows,
  } = summary;

  const fmt = (n, d = 1) => (Number.isFinite(n) ? n.toFixed(d) : "—");

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border shadow-sm md:grid-cols-3 xl:grid-cols-6">
      <Kpi label="Sets made" value={totalRows.toLocaleString()} hint="saved for this game" />
      <Kpi
        label="Average total"
        value={fmt(meanSum, 0)}
        hint={`healthy zone ${fmt(sumWindow.low, 0)}–${fmt(sumWindow.high, 0)} · ideal ≈ ${fmt(theoreticalMean, 0)}`}
      />
      <Kpi
        label="Number spacing"
        value={fmt(meanSpread, 1)}
        hint={`lowest to highest · must be ${minSpread}+`}
      />
      <Kpi
        label="Beyond birthdays"
        value={highShare === null ? "n/a" : `${fmt(highShare, 1)}%`}
        hint={
          highBaseline === null
            ? "this game has no numbers past 31"
            : `numbers past 31 · random ${fmt(highBaseline, 1)}%`
        }
      />
      <Kpi label="Past draws loaded" value={totalDraws.toLocaleString()} hint="real results to test against" />
      <Kpi
        label="Rule exceptions"
        value={relaxedRows}
        hint={relaxedRows === 0 ? "every set passed all rules" : "sets made with loosened rules"}
      />
    </div>
  );
}
