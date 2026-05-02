import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

import GamePresetSelector from "@/components/game-preset-selector";
import StatsBar from "@/components/stats-bar";
import GenerateTab from "@/components/tabs/generate-tab";
import ExcludedTab from "@/components/tabs/excluded-tab";
import InfoTab from "@/components/tabs/info-tab";
import SettingsDialog from "@/components/settings-dialog";

import { PRESETS, resolveConfig } from "@/lib/presets";
import { generateMany } from "@/lib/generator";
import {
  loadExcluded,
  saveExcluded,
  loadSettings,
  saveSettings,
} from "@/lib/storage";

const ReportsModule = lazy(() => import("@/modules/reports/ReportsModule"));

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

  useEffect(() => {
    setExcluded(loadExcluded(config.pick, config.max));
    const s = loadSettings(config.pick, config.max);
    setMode(s.mode);
    setRecentN(s.recentN);
    setResults([]);
    setRelaxed([]);
  }, [config.pick, config.max]);

  useEffect(() => {
    saveExcluded(config.pick, config.max, excluded);
  }, [excluded, config.pick, config.max]);

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

  return (
    <TooltipProvider delayDuration={150}>
      <div
        className={cn(
          "app-shell mx-auto px-4 py-8 sm:py-10",
          activeTab === "reports" ? "max-w-7xl" : "max-w-2xl"
        )}
      >
        <header className="mb-6 flex items-start justify-between gap-3">
          <div className="space-y-2">
            <Badge
              variant="secondary"
              className="accent-bg-soft accent-border-soft accent-text-soft border"
            >
              <Sparkles className="mr-1.5 h-3 w-3" /> SCIENCE-BASED APPROACH
            </Badge>
            <h1 className="accent-grad-text font-display text-4xl font-bold leading-tight sm:text-5xl">
              Lotto Smart Pick
            </h1>
            <p className="text-sm text-muted-foreground">
              Avoid common picks. Minimize jackpot splitting. No magic — just math.
            </p>
          </div>
          <SettingsDialog />
        </header>

        <div className="space-y-4">
          <GamePresetSelector
            presetKey={presetKey}
            onPresetChange={setPresetKey}
            customPick={customPick}
            customMax={customMax}
            onCustomPickChange={setCustomPick}
            onCustomMaxChange={setCustomMax}
            resolvedLabel={config.label}
            resolvedSchedule={config.schedule}
            resolvedPick={config.pick}
            resolvedMax={config.max}
          />

          <StatsBar
            pick={config.pick}
            max={config.max}
            excludedCount={excluded.length}
          />

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="generate">Generate</TabsTrigger>
              <TabsTrigger value="excluded">
                Excluded
                {excluded.length > 0 && (
                  <span className="ml-1.5 rounded-full accent-bg-soft accent-text-soft px-1.5 py-0.5 text-[10px]">
                    {excluded.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="info">How it works</TabsTrigger>
            </TabsList>

            <TabsContent value="generate">
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

            <TabsContent value="excluded">
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

            <TabsContent value="reports">
              <Suspense
                fallback={
                  <div className="rounded-md border border-white/[0.06] p-6 text-sm text-muted-foreground">
                    Loading charts…
                  </div>
                }
              >
                <ReportsModule
                  pick={config.pick}
                  max={config.max}
                  gameLabel={config.label}
                />
              </Suspense>
            </TabsContent>

            <TabsContent value="info">
              <InfoTab />
            </TabsContent>
          </Tabs>
        </div>

        <footer className="mt-10 border-t border-white/[0.06] pt-4 text-center text-[11px] text-muted-foreground">
          Client-side only. No tracking. No backend.
        </footer>
      </div>

      <Toaster />
    </TooltipProvider>
  );
}
