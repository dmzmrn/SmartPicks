import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import {
  SLOT,
  CHART_INK,
  CHART_MARGIN,
  cursorStyle,
  tooltipStyle,
  tooltipItemStyle,
} from "@/lib/chartTheme";

const MUTED_BAR_OPACITY = 0.35;

export default function FrequencyDistributionChart({ frequencyData, hotMin, coldMin }) {
  const data = useMemo(
    () => frequencyData.map((d) => ({ ...d, label: String(d.number).padStart(2, "0") })),
    [frequencyData]
  );

  const isExtreme = (count) => count >= hotMin || count <= coldMin;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Number frequency</CardTitle>
        <CardDescription>
          Times each number was drawn. The most- and least-drawn numbers are highlighted —
          differences like these are normal luck, not a trend.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={CHART_MARGIN}>
              <CartesianGrid stroke={CHART_INK.grid} vertical={false} />
              <XAxis
                dataKey="label"
                tick={CHART_INK.tick}
                interval={Math.max(0, Math.floor(data.length / 30))}
                axisLine={CHART_INK.axisLine}
                tickLine={false}
              />
              <YAxis tick={CHART_INK.tick} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={tooltipStyle}
                itemStyle={tooltipItemStyle}
                cursor={cursorStyle}
                labelFormatter={(v) => `Number ${v}`}
                formatter={(value) => [value, "times drawn"]}
              />
              <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                {data.map((d) => (
                  <Cell
                    key={d.number}
                    fill={SLOT.first}
                    fillOpacity={isExtreme(d.count) ? 1 : MUTED_BAR_OPACITY}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
