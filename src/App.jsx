import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Dices } from "lucide-react";

import GamePresetSelector from "@/components/game-preset-selector";
import StatsBar from "@/components/stats-bar";
import GenerateTab from "@/components/tabs/generate-tab";
import ExcludedTab from "@/components/tabs/excluded-tab";
import InfoTab from "@/components/tabs/info-tab";
import SettingsDialog from "@/components/settings-dialog";

import { resolveConfig } from "@/lib/presets";
import { generateMany } from "@/lib/generator";
import {
  loadExcluded,
  saveExcluded,
  loadSettings,
  saveSettings,
  loadHistory,
  saveHistory,
  HISTORY_LIMIT,
} from "@/lib/storage";

const ReportsModule = lazy(() => import("@/modules/reports/ReportsModule"));
const DashboardModule = lazy(() => import("@/modules/dashboard/DashboardModule"));

const LoadingPanel = ({ label }) => (
  <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">{label}</div>
);

export default function App() {
  const [presetKey, setPresetKey] = useState("6/58");
  const [customPick, setCustomPick] = useState(6);
  const [customMax, setCustomMax] = useState(58);

  const config = useMemo(
    () => resolveConfig(presetKey, customPick, customMax),
    [presetKey, customPick, customMax]
  );

  const [activeTab, setActiveTab] = useState("generate");

  const [avoidBirthdays, setAvoidBirthdays] = useState(true);
  const [avoidSequential, setAvoidSequential] = useState(true);
  const [setsCount, setSetsCount] = useState(5);

  const [results, setResults] = useState([]);
  const [relaxed, setRelaxed] = useState([]);
  const [loading, setLoading] = useState(false);

  const [excluded, setExcluded] = useState([]);
  const [mode, setMode] = useState("off");
  const [recentN, setRecentN] = useState(50);

  // Shared research data: generation history feeds the dashboard; fed draws
  // are shared between the Reports and Dashboard tabs.
  const [history, setHistory] = useState([]);
  const [draws, setDraws] = useState([]);
  const [drawWinners, setDrawWinners] = useState([]);
  const [drawsFileName, setDrawsFileName] = useState("");

  useEffect(() => {
    setExcluded(loadExcluded(config.pick, config.max));
    const s = loadSettings(config.pick, config.max);
    setMode(s.mode);
    setRecentN(s.recentN);
    setResults([]);
    setRelaxed([]);
    setHistory(loadHistory(config.pick, config.max));
    setDraws([]);
    setDrawWinners([]);
    setDrawsFileName("");
  }, [config.pick, config.max]);

  useEffect(() => {
    saveExcluded(config.pick, config.max, excluded);
  }, [excluded, config.pick, config.max]);

  useEffect(() => {
    saveHistory(config.pick, config.max, history);
  }, [history, config.pick, config.max]);

  useEffect(() => {
    saveSettings(config.pick, config.max, { mode, recentN });
  }, [mode, recentN, config.pick, config.max]);

  const effectiveExcludedList = useMemo(() => {
    if (mode === "off") return [];
    if (mode === "recent") return excluded.slice(-recentN);
    return excluded;
  }, [mode, recentN, excluded]);

  const effectiveExcludedSet = useMemo(
    () => new Set(effectiveExcludedList.map((c) => c.join("-"))),
    [effectiveExcludedList]
  );

  const allExcludedSet = useMemo(
    () => new Set(excluded.map((c) => c.join("-"))),
    [excluded]
  );

  const handleGenerate = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      const { results: r, relaxed: rel } = generateMany({
        count: setsCount,
        pick: config.pick,
        max: config.max,
        avoidBirthdays,
        avoidSequential,
        excludedSet: effectiveExcludedSet,
      });
      setResults(r);
      setRelaxed(rel);
      const ts = Date.now();
      const entries = r.map((row) => ({ ts, picks: row.picks, relaxed: row.relaxed }));
      setHistory((prev) => [...prev, ...entries].slice(-HISTORY_LIMIT));
      setLoading(false);
    }, 50);
  }, [
    setsCount,
    config.pick,
    config.max,
    avoidBirthdays,
    avoidSequential,
    effectiveExcludedSet,
  ]);

  const handleExcludeRow = useCallback(
    (picks) => {
      const key = picks.join("-");
      if (allExcludedSet.has(key)) return;
      setExcluded((prev) => [...prev, [...picks].sort((a, b) => a - b)]);
    },
    [allExcludedSet]
  );

  const handleDrawsChange = useCallback((newDraws, name, winners = []) => {
    setDraws(newDraws);
    setDrawsFileName(name);
    setDrawWinners(winners);
  }, []);

  const handleClearHistory = useCallback(() => setHistory([]), []);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Dices className="h-4 w-4" />
            </div>
            <span className="font-semibold tracking-tight">Smart Pick</span>
            <span className="hidden text-sm text-muted-foreground sm:inline">
              · Lottery numbers the crowd doesn't play
            </span>
            <div className="ml-auto">
              <SettingsDialog />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-6 sm:py-8">
          <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">{config.label}</h1>
              <p className="text-sm text-muted-foreground">
                {config.schedule
                  ? `Pick ${config.pick} from 1–${config.max} · Draws ${config.schedule} at 9:00 PM`
                  : `Pick ${config.pick} from 1–${config.max}`}
              </p>
            </div>
            <GamePresetSelector
              presetKey={presetKey}
              onPresetChange={setPresetKey}
              customPick={customPick}
              customMax={customMax}
              onCustomPickChange={setCustomPick}
              onCustomMaxChange={setCustomMax}
            />
          </section>

          <StatsBar pick={config.pick} max={config.max} excludedCount={excluded.length} />

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="h-auto w-full justify-start overflow-x-auto sm:w-auto">
              <TabsTrigger value="generate">Generate</TabsTrigger>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="excluded" className="gap-1.5">
                Excluded
                {excluded.length > 0 && (
                  <span className="rounded-full bg-secondary px-1.5 text-[11px] font-medium tabular-nums text-secondary-foreground">
                    {excluded.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="info">How it works</TabsTrigger>
            </TabsList>

            <TabsContent value="generate" className="mt-6">
              <GenerateTab
                pick={config.pick}
                max={config.max}
                avoidBirthdays={avoidBirthdays}
                setAvoidBirthdays={setAvoidBirthdays}
                avoidSequential={avoidSequential}
                setAvoidSequential={setAvoidSequential}
                setsCount={setsCount}
                setSetsCount={setSetsCount}
                results={results}
                relaxed={relaxed}
                loading={loading}
                onGenerate={handleGenerate}
                excludedSet={allExcludedSet}
                onExcludeRow={handleExcludeRow}
              />
            </TabsContent>

            <TabsContent value="excluded" className="mt-6">
              <ExcludedTab
                pick={config.pick}
                max={config.max}
                excluded={excluded}
                setExcluded={setExcluded}
                mode={mode}
                setMode={setMode}
                recentN={recentN}
                setRecentN={setRecentN}
                effectiveCount={effectiveExcludedList.length}
              />
            </TabsContent>

            <TabsContent value="dashboard" className="mt-6">
              <Suspense fallback={<LoadingPanel label="Loading dashboard…" />}>
                <DashboardModule
                  pick={config.pick}
                  max={config.max}
                  history={history}
                  draws={draws}
                  drawWinners={drawWinners}
                  onGenerate={handleGenerate}
                  loading={loading}
                  onClearHistory={handleClearHistory}
                />
              </Suspense>
            </TabsContent>

            <TabsContent value="reports" className="mt-6">
              <Suspense fallback={<LoadingPanel label="Loading charts…" />}>
                <ReportsModule
                  pick={config.pick}
                  max={config.max}
                  gameLabel={config.label}
                  draws={draws}
                  winners={drawWinners}
                  fileName={drawsFileName}
                  onDrawsChange={handleDrawsChange}
                />
              </Suspense>
            </TabsContent>

            <TabsContent value="info" className="mt-6">
              <InfoTab />
            </TabsContent>
          </Tabs>
        </main>

        <footer className="border-t">
          <div className="mx-auto max-w-6xl px-4 py-5 text-xs text-muted-foreground">
            Runs entirely in your browser — no tracking, no backend. Every combination has
            the same odds of being drawn; this tool only lowers the odds of sharing a win.
          </div>
        </footer>
      </div>

      <Toaster />
    </TooltipProvider>
  );
}
