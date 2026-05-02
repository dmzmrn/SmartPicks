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

const tooltipStyle = {
  background: "#020617",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 6,
  fontSize: 12,
};

export default function SumDistributionChart({ drawStats, meanSum }) {
  const data = drawStats.map((d) => ({ index: d.index, sum: d.sum }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sum per draw</CardTitle>
        <CardDescription>How total sums move across draws — mean reference line.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="sumGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
              <XAxis
                dataKey="index"
                tick={{ fill: "#64748b", fontSize: 10, fontFamily: "monospace" }}
                axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#64748b", fontSize: 10, fontFamily: "monospace" }}
                axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                tickLine={false}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <ReferenceLine y={meanSum} stroke="#a78bfa" strokeDasharray="4 4" label={{ value: `μ ${meanSum.toFixed(0)}`, fill: "#a78bfa", fontSize: 10 }} />
              <Area
                type="monotone"
                dataKey="sum"
                stroke="#818cf8"
                fill="url(#sumGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
