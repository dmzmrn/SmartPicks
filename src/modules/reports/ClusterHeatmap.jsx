import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const COLS = 14;

export default function ClusterHeatmap({ frequencyData, max }) {
  const peak = frequencyData.reduce((m, d) => Math.max(m, d.count), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Frequency heatmap</CardTitle>
        <CardDescription>
          Cell intensity scales with draw count. Hover for details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
        >
          {frequencyData.map(({ number, count }) => {
            const intensity = peak > 0 ? count / peak : 0;
            const opacity = 0.08 + intensity * 0.85;
            return (
              <div
                key={number}
                title={`${number} — drawn ${count}×`}
                className="heatmap-cell flex aspect-square items-center justify-center rounded text-[11px] font-mono"
                style={{
                  background: `rgba(99, 102, 241, ${opacity})`,
                  color: intensity > 0.55 ? "#fff" : "#cbd5e1",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                {String(number).padStart(2, "0")}
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>Cold</span>
          <div
            className="h-2 flex-1 rounded"
            style={{
              background:
                "linear-gradient(to right, rgba(99,102,241,0.08), rgba(99,102,241,0.95))",
            }}
          />
          <span>Hot</span>
          <span className="ml-2 text-slate-500">— max {peak}× over {max} numbers</span>
        </div>
      </CardContent>
    </Card>
  );
}
