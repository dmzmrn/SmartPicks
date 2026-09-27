import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getDrawScoreAnalysis } from "./dashboardCalculations";
import {
  SERIES,
  CHART_INK,
  CHART_MARGIN,
  BAR_RADIUS,
  cursorStyle,
  tooltipStyle,
  tooltipItemStyle,
} from "@/lib/chartTheme";

const Tile = ({ label, value, hint }) => (
  <div className="space-y-1 rounded-md border px-4 py-3">
    <div className="text-xs font-medium text-muted-foreground">{label}</div>
    <div className="text-lg font-semibold tabular-nums tracking-tight">{value}</div>
    {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
  </div>
);

export default function DrawAnalysisCard({ draws, winners, pick, max }) {
  const [useWinners, setUseWinners] = useState(true);

  const analysis = useMemo(
    () => getDrawScoreAnalysis(draws, winners, pick, max),
    [draws, winners, pick, max]
  );

  const { hasWinnerData, withWinnerCount, avgScore, bands, crowdLike, uncommon, totalDraws } = analysis;
  const winnersMode = useWinners && hasWinnerData;

  const bucketData = [
    { bucket: "Crowd-like (score < 60)", avgWinners: crowdLike.avgWinners, draws: crowdLike.draws },
    { bucket: "Uncommon (score ≥ 60)", avgWinners: uncommon.avgWinners, draws: uncommon.draws },
  ];

  const thesisHolds =
    crowdLike.draws > 0 && uncommon.draws > 0 && crowdLike.avgWinners > uncommon.avgWinners;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle>The winning numbers, analyzed</CardTitle>
            <CardDescription>
              Every real draw you loaded gets the same 0–100 crowd score as your picks.{" "}
              {hasWinnerData
                ? "Your file includes winner counts, so we can check the big claim: do crowd-like numbers really split prizes more often?"
                : "Add a winner count after each draw in your file (0 = nobody won the jackpot) to unlock the winner analysis."}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <Label
                htmlFor="useWinners"
                className={`text-sm font-normal text-muted-foreground ${hasWinnerData ? "cursor-pointer" : "opacity-60"}`}
              >
                Use winner counts
              </Label>
              <Switch
                id="useWinners"
                checked={winnersMode}
                disabled={!hasWinnerData}
                onCheckedChange={setUseWinners}
              />
            </div>
            {!hasWinnerData && (
              <span className="text-xs text-muted-foreground">
                no winner column detected in your file
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {winnersMode ? (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Tile label="Draws with winner info" value={withWinnerCount} hint={`of ${totalDraws} loaded`} />
              <Tile
                label="Avg score of winning numbers"
                value={avgScore.toFixed(0)}
                hint="random draws average 50 by design"
              />
              <Tile
                label="Crowd-like draws"
                value={`${crowdLike.avgWinners.toFixed(2)} winners avg`}
                hint={`${crowdLike.draws} draws · jackpot hit in ${crowdLike.jackpotHitShare.toFixed(0)}%`}
              />
              <Tile
                label="Uncommon draws"
                value={`${uncommon.avgWinners.toFixed(2)} winners avg`}
                hint={`${uncommon.draws} draws · jackpot hit in ${uncommon.jackpotHitShare.toFixed(0)}%`}
              />
            </div>

            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bucketData} margin={CHART_MARGIN}>
                  <CartesianGrid stroke={CHART_INK.grid} vertical={false} />
                  <XAxis dataKey="bucket" tick={CHART_INK.tick} axisLine={CHART_INK.axisLine} tickLine={false} />
                  <YAxis tick={CHART_INK.tick} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    itemStyle={tooltipItemStyle}
                    cursor={cursorStyle}
                    formatter={(value, name, { payload }) => [
                      `${value.toFixed(2)} avg winners (${payload.draws} draws)`,
                      "average winners per draw",
                    ]}
                  />
                  <Bar dataKey="avgWinners" fill={SERIES.historical} radius={BAR_RADIUS} maxBarSize={64} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <p className="text-sm leading-relaxed text-muted-foreground">
              {crowdLike.draws === 0 || uncommon.draws === 0
                ? "Not enough draws in one of the groups yet — load more results for a fair comparison."
                : thesisHolds
                  ? `In your data, draws with crowd-like winning numbers averaged ${crowdLike.avgWinners.toFixed(2)} winners, while uncommon ones averaged ${uncommon.avgWinners.toFixed(2)}. That's the split effect this tool is built to avoid — when uncommon numbers win, fewer people share the prize.`
                  : `In this file, uncommon winning numbers didn't show fewer winners (${uncommon.avgWinners.toFixed(2)} vs ${crowdLike.avgWinners.toFixed(2)}). Small samples wobble a lot — the effect usually appears over hundreds of draws.`}
            </p>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              <Tile label="Draws analyzed" value={totalDraws} />
              <Tile
                label="Avg score of winning numbers"
                value={avgScore.toFixed(0)}
                hint="random draws average 50 by design"
              />
              <Tile
                label="What this tells you"
                value="Any numbers can win"
                hint="the score only changes who you'd share with"
              />
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bands} margin={CHART_MARGIN}>
                  <CartesianGrid stroke={CHART_INK.grid} vertical={false} />
                  <XAxis dataKey="band" tick={CHART_INK.tick} axisLine={CHART_INK.axisLine} tickLine={false} />
                  <YAxis allowDecimals={false} tick={CHART_INK.tick} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    itemStyle={tooltipItemStyle}
                    cursor={cursorStyle}
                    labelFormatter={(v) => `Score ${v}`}
                    formatter={(value) => [value, "draws"]}
                  />
                  <Bar dataKey="count" fill={SERIES.historical} radius={BAR_RADIUS} maxBarSize={64} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              How the real winning numbers score on the crowd-avoidance scale.
              Low-scoring draws prove crowd numbers get drawn too — winning
              isn't the point of the score. Sharing is.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
