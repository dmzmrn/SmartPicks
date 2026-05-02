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

const tooltipStyle = {
  background: "#020617",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 6,
  fontSize: 12,
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
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-base">Pattern trends</CardTitle>
          <CardDescription>Stacked composition per draw.</CardDescription>
        </div>
        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={(v) => v && setMode(v)}
          size="sm"
          variant="outline"
        >
          <ToggleGroupItem value="oe">Odd / Even</ToggleGroupItem>
          <ToggleGroupItem value="lh">Low / High</ToggleGroupItem>
        </ToggleGroup>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
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
                allowDecimals={false}
              />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {mode === "oe" ? (
                <>
                  <Bar dataKey="odd" stackId="a" fill="#a78bfa" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="even" stackId="a" fill="#facc15" radius={[3, 3, 0, 0]} />
                </>
              ) : (
                <>
                  <Bar dataKey="low" stackId="a" fill="#60a5fa" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="high" stackId="a" fill="#34d399" radius={[3, 3, 0, 0]} />
                </>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
