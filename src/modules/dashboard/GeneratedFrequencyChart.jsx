import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ComposedChart,
  Bar,
  Line,
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
  cursorStyle,
  tooltipStyle,
  tooltipItemStyle,
  legendStyle,
  legendFormatter,
} from "@/lib/chartTheme";

export default function GeneratedFrequencyChart({ generatedFreq, drawFreq, hasDraws }) {
  const data = generatedFreq.map((g, i) => ({
    number: g.number,
    generated: g.share * 100,
    historical: hasDraws ? drawFreq[i].share * 100 : null,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Which numbers you're playing</CardTitle>
        <CardDescription>
          How often each number appears in your sets — higher past 32 by design.
          {hasDraws &&
            " The line shows how often it came up in the real draws you loaded: roughly flat, because every number is equally likely."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={CHART_MARGIN}>
              <CartesianGrid stroke={CHART_INK.grid} vertical={false} />
              <XAxis
                dataKey="number"
                tick={CHART_INK.tick}
                axisLine={CHART_INK.axisLine}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis unit="%" tick={CHART_INK.tick} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={tooltipStyle}
                itemStyle={tooltipItemStyle}
                cursor={cursorStyle}
                labelFormatter={(v) => `Number ${v}`}
                formatter={(value) => `${value.toFixed(2)}%`}
              />
              {hasDraws && <Legend wrapperStyle={legendStyle} formatter={legendFormatter} />}
              <Bar name="Your picks" dataKey="generated" fill={SERIES.generated} radius={[2, 2, 0, 0]} />
              {hasDraws && (
                <Line
                  name="Real draws"
                  dataKey="historical"
                  stroke={SERIES.historical}
                  strokeWidth={2}
                  dot={false}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
