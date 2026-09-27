import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import {
  CHART_INK,
  CHART_MARGIN,
  SERIES,
  tooltipStyle,
  tooltipItemStyle,
} from "@/lib/chartTheme";

const referenceLabel = (value) => ({ value, fill: CHART_INK.reference, fontSize: 11, position: "top" });

export default function SumWindowChart({ histogram }) {
  const { bins, window, minSum, maxSum } = histogram;
  const data = bins.map((b) => ({ mid: b.mid, count: b.count, range: `${b.from}–${b.to}` }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set totals</CardTitle>
        <CardDescription>
          Add up a set's numbers to get its total. Extreme totals look like patterns people
          play, so every total lands between the dashed limits.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ ...CHART_MARGIN, top: 20 }}>
              <CartesianGrid stroke={CHART_INK.grid} vertical={false} />
              <XAxis
                dataKey="mid"
                type="number"
                domain={[minSum, maxSum]}
                tick={CHART_INK.tick}
                axisLine={CHART_INK.axisLine}
                tickLine={false}
                tickFormatter={(v) => Math.round(v)}
              />
              <YAxis allowDecimals={false} tick={CHART_INK.tick} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={tooltipStyle}
                itemStyle={tooltipItemStyle}
                labelFormatter={(v) => `total ≈ ${Math.round(v)}`}
                formatter={(value) => [value, "sets"]}
              />
              {/* Dashed = threshold semantics: these are the filter bounds. */}
              <ReferenceLine x={window.low} stroke={CHART_INK.reference} strokeDasharray="4 4" label={referenceLabel("low limit")} />
              <ReferenceLine x={window.mean} stroke={CHART_INK.reference} label={referenceLabel(`average ${window.mean.toFixed(0)}`)} />
              <ReferenceLine x={window.high} stroke={CHART_INK.reference} strokeDasharray="4 4" label={referenceLabel("high limit")} />
              <Area
                type="step"
                dataKey="count"
                stroke={SERIES.generated}
                strokeWidth={2}
                fill={SERIES.generated}
                fillOpacity={0.15}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
