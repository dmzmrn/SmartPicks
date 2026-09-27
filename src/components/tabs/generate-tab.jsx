import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertTriangle, Copy, Check, Ban, Sparkles } from "lucide-react";
import Ball, { BallLegend } from "@/components/ball";
import ResultStats from "@/components/result-stats";
import ScoreBadge from "@/components/score-badge";
import { computeStats } from "@/lib/stats";
import { scoreRow, BIRTHDAY_RANGE_MAX } from "@/lib/scoring";
import { handleCopy } from "@/lib/clipboard";

const COPIED_FEEDBACK_MS = 1500;

const RELAXED_LABELS = {
  digit: "ending-digit diversity",
  spread: "spread",
  consecutive: "no-consecutive",
  sum: "sum window",
  pattern: "evenly spaced pattern",
};

const formatRelaxed = (list) =>
  list.map((k) => RELAXED_LABELS[k] || k).join(", ");

const formatNumber = (n) => String(n).padStart(2, "0");

function IconAction({ label, onClick, disabled, children }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={disabled ? 0 : -1}>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            aria-label={label}
            onClick={onClick}
            disabled={disabled}
          >
            {children}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function ResultRow({ index, picks, relaxed, max, onCopy, onExclude, isSaved, isCopied }) {
  const stats = computeStats(picks, max);
  const { score, label } = scoreRow(picks, relaxed, picks.length, max);
  return (
    <li className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:gap-5">
      <span className="w-6 text-xs font-medium tabular-nums text-muted-foreground">
        {formatNumber(index + 1)}
      </span>
      <div className="flex-1 space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {picks.map((n) => (
            <Ball key={n} n={n} />
          ))}
        </div>
        <ResultStats stats={stats} />
      </div>
      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <ScoreBadge score={score} label={label} />
        <div className="flex gap-1">
          <IconAction label={isCopied ? "Copied" : "Copy numbers"} onClick={onCopy}>
            {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </IconAction>
          <IconAction
            label={isSaved ? "Saved to excluded list" : "Exclude from future picks"}
            onClick={onExclude}
            disabled={isSaved}
          >
            {isSaved ? <Check className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
          </IconAction>
        </div>
      </div>
    </li>
  );
}

function SwitchRow({ id, label, hint, checked, onCheckedChange }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <Label htmlFor={id} className="cursor-pointer space-y-1 leading-snug">
        <span className="block">{label}</span>
        <span className="block text-xs font-normal text-muted-foreground">{hint}</span>
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function EmptyResults() {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
      <Sparkles className="h-5 w-5 text-muted-foreground" />
      <p className="text-sm font-medium">No picks yet</p>
      <p className="max-w-xs text-sm text-muted-foreground">
        Adjust the settings, then press Generate. Each set is scored for how rarely other
        players choose it.
      </p>
    </div>
  );
}

export default function GenerateTab({
  pick,
  max,
  avoidBirthdays,
  setAvoidBirthdays,
  avoidSequential,
  setAvoidSequential,
  setsCount,
  setSetsCount,
  results,
  relaxed,
  loading,
  onGenerate,
  excludedSet,
  onExcludeRow,
}) {
  const [orientation, setOrientation] = useState("horizontal");
  const [sep, setSep] = useState(", ");
  const [allCopied, setAllCopied] = useState(false);
  const [rowCopied, setRowCopied] = useState(null);
  const [rowSaved, setRowSaved] = useState(null);

  const sCount = setsCount === 1 ? "" : "s";

  const formatAll = () => {
    const lines = results.map((r) => r.picks.map(formatNumber).join(sep));
    return orientation === "horizontal" ? lines.join("\n") : lines.flatMap((l) => l.split(sep)).join("\n");
  };

  const copyAll = async () => {
    if (results.length === 0) return;
    const ok = await handleCopy(formatAll());
    if (ok) {
      setAllCopied(true);
      setTimeout(() => setAllCopied(false), COPIED_FEEDBACK_MS);
    }
  };

  const copyRow = async (idx) => {
    const r = results[idx];
    if (!r) return;
    const ok = await handleCopy(r.picks.map(formatNumber).join(sep));
    if (ok) {
      setRowCopied(idx);
      setTimeout(() => setRowCopied(null), COPIED_FEEDBACK_MS);
    }
  };

  const excludeRow = (idx) => {
    onExcludeRow(results[idx].picks);
    setRowSaved(idx);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>Tune the filters, then generate.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <SwitchRow
            id="avoidBirthdays"
            label="Avoid birthday range"
            hint="Weights picks toward 32+, which fewer people play."
            checked={avoidBirthdays}
            onCheckedChange={setAvoidBirthdays}
          />
          <SwitchRow
            id="avoidSequential"
            label="Avoid 3+ in a row"
            hint="Rejects runs like 12 · 13 · 14."
            checked={avoidSequential}
            onCheckedChange={setAvoidSequential}
          />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="setsCount">Number of sets</Label>
              <span className="text-sm font-semibold tabular-nums">{setsCount}</span>
            </div>
            <Slider
              id="setsCount"
              min={1}
              max={20}
              step={1}
              value={[setsCount]}
              onValueChange={(v) => setSetsCount(v[0])}
            />
          </div>
          <Button size="lg" disabled={loading} onClick={onGenerate} className="w-full">
            {loading ? "Generating…" : `Generate ${setsCount} pick${sCount}`}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {relaxed.length > 0 && (
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <span className="font-medium">Filters relaxed:</span> {formatRelaxed(relaxed)}. The
              generator couldn't satisfy every constraint within its attempt budget — try reducing
              your exclusion list or loosening the toggles for stricter output.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader className="flex flex-col gap-4 space-y-0 border-b sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1.5">
              <CardTitle>Your picks</CardTitle>
              <CardDescription>Scored by how rarely other players choose them.</CardDescription>
            </div>
            {results.length > 0 && (
              <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-nowrap">
                <ToggleGroup
                  type="single"
                  value={orientation}
                  onValueChange={(v) => v && setOrientation(v)}
                  size="sm"
                  variant="outline"
                  aria-label="Copy layout"
                >
                  <ToggleGroupItem value="horizontal">Rows</ToggleGroupItem>
                  <ToggleGroupItem value="vertical">Column</ToggleGroupItem>
                </ToggleGroup>
                <Input
                  className="h-9 w-16 text-center font-mono"
                  aria-label="Separator"
                  maxLength={8}
                  value={sep}
                  disabled={orientation === "vertical"}
                  title={
                    orientation === "vertical"
                      ? "Separator is unused in column mode (each number on its own line)."
                      : "Separator between numbers"
                  }
                  onChange={(e) => setSep(e.target.value)}
                />
                <Button size="sm" variant="outline" onClick={copyAll} className="gap-1.5">
                  {allCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {allCopied ? "Copied" : "Copy all"}
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {results.length === 0 ? (
              <EmptyResults />
            ) : (
              <ul className="divide-y">
                {results.map((r, i) => (
                  <ResultRow
                    key={r.picks.join("-")}
                    index={i}
                    picks={r.picks}
                    relaxed={r.relaxed}
                    max={max}
                    onCopy={() => copyRow(i)}
                    onExclude={() => excludeRow(i)}
                    isSaved={excludedSet.has(r.picks.join("-")) || rowSaved === i}
                    isCopied={rowCopied === i}
                  />
                ))}
              </ul>
            )}
          </CardContent>
          {results.length > 0 && max > BIRTHDAY_RANGE_MAX && (
            <div className="border-t px-6 py-3">
              <BallLegend />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
