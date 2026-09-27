import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  SERIES,
  CHART_INK,
  CHART_MARGIN,
  BAR_RADIUS,
  cursorStyle,
  tooltipStyle,
  tooltipItemStyle,
} from "@/lib/chartTheme";

export default function MatchDistributionChart({ matchData }) {
  const { distribution, totalPairs, best } = matchData;
  const data = distribution.map((d) => ({
    matches: `${d.matches}`,
    count: d.count,
    share: d.share,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reality check: your picks vs real draws</CardTitle>
        <CardDescription>
          Every set you made, compared with every real draw you loaded (
          {totalPairs.toLocaleString()} comparisons). Best so far: {best} matching number
          {best === 1 ? "" : "s"}. Mostly 0–2 is normal for any numbers; small prizes usually
          start at 3.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ ...CHART_MARGIN, bottom: 12 }}>
              <CartesianGrid stroke={CHART_INK.grid} vertical={false} />
              <XAxis
                dataKey="matches"
                tick={CHART_INK.tick}
                axisLine={CHART_INK.axisLine}
                tickLine={false}
                label={{ value: "matched numbers", position: "insideBottom", offset: -8, fill: CHART_INK.reference, fontSize: 11 }}
              />
              <YAxis allowDecimals={false} tick={CHART_INK.tick} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={tooltipStyle}
                itemStyle={tooltipItemStyle}
                cursor={cursorStyle}
                labelFormatter={(v) => `${v} matched`}
                formatter={(value, name, { payload }) => [
                  `${value.toLocaleString()} (${payload.share.toFixed(2)}%)`,
                  "comparisons",
                ]}
              />
              <Bar dataKey="count" fill={SERIES.generated} radius={BAR_RADIUS} maxBarSize={64} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
