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
import { SLOT, CHART_INK, CHART_MARGIN, tooltipStyle, tooltipItemStyle } from "@/lib/chartTheme";

export default function SumDistributionChart({ drawStats, meanSum }) {
  const data = drawStats.map((d) => ({ index: d.index, sum: d.sum }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sum per draw</CardTitle>
        <CardDescription>How each draw's total moves over time, against the average.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ ...CHART_MARGIN, top: 20 }}>
              <CartesianGrid stroke={CHART_INK.grid} vertical={false} />
              <XAxis dataKey="index" tick={CHART_INK.tick} axisLine={CHART_INK.axisLine} tickLine={false} />
              <YAxis tick={CHART_INK.tick} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={tooltipStyle}
                itemStyle={tooltipItemStyle}
                labelFormatter={(v) => `Draw ${v}`}
                formatter={(value) => [value, "sum"]}
              />
              <ReferenceLine
                y={meanSum}
                stroke={CHART_INK.reference}
                strokeDasharray="4 4"
                label={{ value: `average ${meanSum.toFixed(0)}`, fill: CHART_INK.reference, fontSize: 11, position: "insideTopRight" }}
              />
              <Area
                type="monotone"
                dataKey="sum"
                stroke={SLOT.first}
                strokeWidth={2}
                fill={SLOT.first}
                fillOpacity={0.12}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
