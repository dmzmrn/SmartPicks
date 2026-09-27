import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  SLOT,
  CHART_INK,
  CHART_MARGIN,
  cursorStyle,
  tooltipStyle,
  tooltipItemStyle,
  legendStyle,
  legendFormatter,
} from "@/lib/chartTheme";

// Two parts of one composition: validated palette slots 1 and 2, with a 2px
// surface gap between stacked segments.
const SPLITS = {
  oe: [
    { key: "odd", name: "Odd", fill: SLOT.first },
    { key: "even", name: "Even", fill: SLOT.second },
  ],
  lh: [
    { key: "low", name: "Low", fill: SLOT.first },
    { key: "high", name: "High", fill: SLOT.second },
  ],
};

export default function PatternAnalysisChart({ drawStats }) {
  const [mode, setMode] = useState("oe");
  const data = useMemo(
    () =>
      drawStats.map((d) => ({
        index: d.index,
        odd: d.odd,
        even: d.even,
        low: d.low,
        high: d.high,
      })),
    [drawStats]
  );

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <CardTitle>Pattern trends</CardTitle>
          <CardDescription>How each draw splits.</CardDescription>
        </div>
        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={(v) => v && setMode(v)}
          size="sm"
          variant="outline"
          aria-label="Split"
        >
          <ToggleGroupItem value="oe">Odd/Even</ToggleGroupItem>
          <ToggleGroupItem value="lh">Low/High</ToggleGroupItem>
        </ToggleGroup>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={CHART_MARGIN}>
              <CartesianGrid stroke={CHART_INK.grid} vertical={false} />
              <XAxis dataKey="index" tick={CHART_INK.tick} axisLine={CHART_INK.axisLine} tickLine={false} />
              <YAxis tick={CHART_INK.tick} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={tooltipStyle}
                itemStyle={tooltipItemStyle}
                cursor={cursorStyle}
                labelFormatter={(v) => `Draw ${v}`}
              />
              <Legend wrapperStyle={legendStyle} formatter={legendFormatter} />
              {SPLITS[mode].map((s) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  name={s.name}
                  stackId="split"
                  fill={s.fill}
                  stroke="hsl(var(--card))"
                  strokeWidth={2}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
