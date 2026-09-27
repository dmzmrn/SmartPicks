import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Info, RefreshCw, Trash2 } from "lucide-react";
import {
  frequencyShare,
  getTierDistribution,
  getSumHistogram,
  getMatchDistribution,
  getDashboardSummary,
  getLatestBatch,
} from "./dashboardCalculations";
import KpiRow from "./KpiRow";
import BatchScorecard from "./BatchScorecard";
import TierDistributionChart from "./TierDistributionChart";
import SumWindowChart from "./SumWindowChart";
import GeneratedFrequencyChart from "./GeneratedFrequencyChart";
import MatchDistributionChart from "./MatchDistributionChart";
import DrawAnalysisCard from "./DrawAnalysisCard";

const EmptyHint = ({ children }) => (
  <div className="rounded-lg border border-dashed px-6 py-12 text-center text-sm text-muted-foreground">
    {children}
  </div>
);

export default function DashboardModule({
  pick,
  max,
  history,
  draws,
  drawWinners,
  onGenerate,
  loading,
  onClearHistory,
}) {
  const [confirmClear, setConfirmClear] = useState(false);

  const pickRows = useMemo(() => history.map((h) => h.picks), [history]);
  const hasHistory = pickRows.length > 0;
  const hasDraws = draws.length > 0;

  const summary = useMemo(
    () => getDashboardSummary(history, draws, pick, max),
    [history, draws, pick, max]
  );
  const latestBatch = useMemo(() => getLatestBatch(history), [history]);
  const tierData = useMemo(() => getTierDistribution(pickRows, max), [pickRows, max]);
  const generatedFreq = useMemo(() => frequencyShare(pickRows, max), [pickRows, max]);
  const drawFreq = useMemo(() => frequencyShare(draws, max), [draws, max]);
  const histogram = useMemo(
    () => getSumHistogram(pickRows, pick, max),
    [pickRows, pick, max]
  );
  const matchData = useMemo(
    () => getMatchDistribution(pickRows, draws, pick),
    [pickRows, draws, pick]
  );

  const handleClear = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    setConfirmClear(false);
    onClearHistory();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">Your picks at a glance</h2>
          <p className="text-sm text-muted-foreground">
            Every set you generate for this game is saved and analyzed here.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasHistory && (
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 text-muted-foreground"
              onClick={handleClear}
              onBlur={() => setConfirmClear(false)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {confirmClear ? "Click again to confirm" : "Clear history"}
            </Button>
          )}
          <Button size="sm" disabled={loading} onClick={onGenerate} className="gap-1.5">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Generating…" : "Generate new picks"}
          </Button>
        </div>
      </div>

      <div className="flex gap-3 rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Every draw is pure chance — no number is ever “due” and there is no lucky time to
          play. What you can control is playing numbers few other people pick, so a win is
          shared with fewer people. That is what everything on this page measures.
        </p>
      </div>

      {!hasHistory && (
        <EmptyHint>
          No picks yet. Press <span className="font-medium text-foreground">Generate new picks</span>{" "}
          and this page becomes your personal report.
        </EmptyHint>
      )}

      {hasHistory && (
        <div className="space-y-6">
          <KpiRow summary={summary} />

          <BatchScorecard batch={latestBatch} pick={pick} max={max} />

          <div className="grid gap-6 lg:grid-cols-2">
            <TierDistributionChart tierData={tierData} />
            <SumWindowChart histogram={histogram} />
          </div>

          <GeneratedFrequencyChart
            generatedFreq={generatedFreq}
            drawFreq={drawFreq}
            hasDraws={hasDraws}
          />

          {hasDraws ? (
            <MatchDistributionChart matchData={matchData} />
          ) : (
            <EmptyHint>
              Want a reality check? Load past results in the{" "}
              <span className="font-medium text-foreground">Reports</span> tab and every pick is
              tested against real draws here.
            </EmptyHint>
          )}
        </div>
      )}

      {hasDraws && (
        <DrawAnalysisCard draws={draws} winners={drawWinners} pick={pick} max={max} />
      )}
    </div>
  );
}
