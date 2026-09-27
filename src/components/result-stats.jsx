export default function ResultStats({ stats }) {
  const { sum, z, low, high, even, odd, spread } = stats;
  const items = [
    ["Sum", sum],
    ["z", `${z >= 0 ? "+" : ""}${z.toFixed(2)}`],
    ["Low/High", `${low}/${high}`],
    ["Even/Odd", `${even}/${odd}`],
    ["Span", spread],
  ];

  return (
    <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {items.map(([label, value]) => (
        <div key={label} className="flex gap-1">
          <dt>{label}</dt>
          <dd className="font-medium tabular-nums text-foreground">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
