import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  SERIES,
  CHART_INK,
  CHART_MARGIN,
  BAR_RADIUS,
  cursorStyle,
  tooltipStyle,
  tooltipItemStyle,
  legendStyle,
  legendFormatter,
} from "@/lib/chartTheme";

export default function TierDistributionChart({ tierData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dodging the crowd</CardTitle>
        <CardDescription>
          Share of your numbers in each range, against purely random picks. Most people play
          birthdays, so 1–31 is crowded — a taller 32+ bar means your numbers sit where the
          crowd doesn't.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={tierData} margin={CHART_MARGIN} barGap={2}>
              <CartesianGrid stroke={CHART_INK.grid} vertical={false} />
              <XAxis dataKey="tier" tick={CHART_INK.tick} axisLine={CHART_INK.axisLine} tickLine={false} />
              <YAxis unit="%" tick={CHART_INK.tick} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={tooltipStyle}
                itemStyle={tooltipItemStyle}
                cursor={cursorStyle}
                formatter={(value) => `${value.toFixed(1)}%`}
              />
              <Legend wrapperStyle={legendStyle} formatter={legendFormatter} />
              <Bar name="Your picks" dataKey="generated" fill={SERIES.generated} radius={BAR_RADIUS} maxBarSize={48} />
              <Bar name="Random picks" dataKey="baseline" fill={SERIES.baseline} radius={BAR_RADIUS} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
