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

const tooltipStyle = {
  background: "#020617",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 6,
  fontSize: 12,
};

export default function FrequencyDistributionChart({ frequencyData, hotMin, coldMin }) {
  const data = useMemo(
    () => frequencyData.map((d) => ({ ...d, label: String(d.number).padStart(2, "0") })),
    [frequencyData]
  );

  const cellColor = (count) => {
    if (count >= hotMin) return "#4ade80";
    if (count <= coldMin) return "#f87171";
    return "#6366f1";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Number frequency</CardTitle>
        <CardDescription>Hottest in green, coldest in red.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tick={{ fill: "#64748b", fontSize: 10, fontFamily: "monospace" }}
                interval={Math.max(0, Math.floor(data.length / 30))}
                axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#64748b", fontSize: 10, fontFamily: "monospace" }}
                axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                {data.map((d) => (
                  <Cell key={d.number} fill={cellColor(d.count)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
