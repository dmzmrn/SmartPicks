import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SLOT } from "@/lib/chartTheme";

const COLS = 14;
const MIN_FILL = 8;
const FILL_RANGE = 85;
const LIGHT_TEXT_THRESHOLD = 0.55;
const STRONG_CELL_TEXT = "#ffffff";

// Sequential encoding: one hue (chart slot 1), light → dark with frequency.
const cellFill = (intensity) =>
  `color-mix(in srgb, ${SLOT.first} ${MIN_FILL + intensity * FILL_RANGE}%, transparent)`;

export default function ClusterHeatmap({ frequencyData, max }) {
  const peak = frequencyData.reduce((m, d) => Math.max(m, d.count), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Frequency heatmap</CardTitle>
        <CardDescription>Darker cells were drawn more often. Hover a cell for its count.</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
        >
          {frequencyData.map(({ number, count }) => {
            const intensity = peak > 0 ? count / peak : 0;
            return (
              <div
                key={number}
                title={`${number} — drawn ${count}×`}
                className="heatmap-cell flex aspect-square items-center justify-center rounded text-xs tabular-nums"
                style={{
                  background: cellFill(intensity),
                  color: intensity > LIGHT_TEXT_THRESHOLD ? STRONG_CELL_TEXT : "hsl(var(--foreground))",
                }}
              >
                {String(number).padStart(2, "0")}
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <span>Less</span>
          <div
            className="h-2 flex-1 rounded"
            style={{ background: `linear-gradient(to right, ${cellFill(0)}, ${cellFill(1)})` }}
          />
          <span>More</span>
          <span className="ml-2">
            peak {peak}× across {max} numbers
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
