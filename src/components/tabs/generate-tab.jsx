import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AlertTriangle, Copy, Check, Plus } from "lucide-react";
import Ball from "@/components/ball";
import ResultStats from "@/components/result-stats";
import { computeStats } from "@/lib/stats";
import { handleCopy } from "@/lib/clipboard";

const RELAXED_LABELS = {
  digit: "ending-digit diversity",
  spread: "spread",
  consecutive: "no-consecutive",
  sum: "sum window",
};

const formatRelaxed = (list) =>
  list.map((k) => RELAXED_LABELS[k] || k).join(", ");

function ResultRow({ index, picks, max, onCopy, onExclude, isExcluded, copiedRow, savedRow }) {
  const stats = computeStats(picks, max);
  return (
    <div className="flex items-start gap-3 rounded-md border border-white/[0.05] bg-white/[0.015] p-3">
      <span className="mt-1 font-mono text-xs text-slate-500">
        #{String(index + 1).padStart(2, "0")}
      </span>
      <div className="flex-1 space-y-1.5">
        <div className="flex flex-wrap gap-1.5">
          {picks.map((n, i) => (
            <Ball key={`${n}-${i}`} n={n} max={max} />
          ))}
        </div>
        <ResultStats stats={stats} />
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <Button size="sm" variant="ghost" className="h-7 gap-1.5 px-2 text-xs" onClick={onCopy}>
          {copiedRow ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
          {copiedRow ? "Copied" : "Copy"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 gap-1.5 px-2 text-xs"
          onClick={onExclude}
          disabled={isExcluded || savedRow}
        >
          {isExcluded || savedRow ? (
            <>
              <Check className="h-3 w-3 text-green-400" /> Saved
            </>
          ) : (
            <>
              <Plus className="h-3 w-3" /> Exclude
            </>
          )}
        </Button>
      </div>
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
    const lines = results.map((r) => r.picks.map((n) => String(n).padStart(2, "0")).join(sep));
    return orientation === "horizontal" ? lines.join("\n") : lines.flatMap((l) => l.split(sep)).join("\n");
  };

  const copyAll = async () => {
    if (results.length === 0) return;
    const ok = await handleCopy(formatAll());
    if (ok) {
      setAllCopied(true);
      setTimeout(() => setAllCopied(false), 1500);
    }
  };

  const copyRow = async (idx) => {
    const r = results[idx];
    if (!r) return;
    const text = r.picks.map((n) => String(n).padStart(2, "0")).join(sep);
    const ok = await handleCopy(text);
    if (ok) {
      setRowCopied(idx);
      setTimeout(() => setRowCopied(null), 1500);
    }
  };

  const excludeRow = (idx) => {
    onExcludeRow(results[idx].picks);
    setRowSaved(idx);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Options</CardTitle>
          <CardDescription>Tune the filters before generating.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="avoidBirthdays" className="cursor-pointer text-sm">
              Avoid birthday range (1–31)
              <span className="block text-[11px] text-muted-foreground">
                Tiered weights bias picks toward 32+.
              </span>
            </Label>
            <Switch
              id="avoidBirthdays"
              checked={avoidBirthdays}
              onCheckedChange={setAvoidBirthdays}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="avoidSequential" className="cursor-pointer text-sm">
              Avoid 3+ consecutive
              <span className="block text-[11px] text-muted-foreground">
                Reject runs like 12·13·14.
              </span>
            </Label>
            <Switch
              id="avoidSequential"
              checked={avoidSequential}
              onCheckedChange={setAvoidSequential}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Sets</Label>
              <span className="font-mono text-sm text-indigo-200">{setsCount}</span>
            </div>
            <Slider
              min={1}
              max={20}
              step={1}
              value={[setsCount]}
              onValueChange={(v) => setSetsCount(v[0])}
            />
          </div>
        </CardContent>
      </Card>

      <Button
        size="lg"
        disabled={loading}
        onClick={onGenerate}
        className="w-full accent-grad text-base text-white"
      >
        {loading ? "Generating…" : `Generate ${setsCount} Smart Pick${sCount}`}
      </Button>

      {relaxed.length > 0 && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <span className="font-medium">Filters relaxed:</span>{" "}
            {formatRelaxed(relaxed)}. The generator couldn't satisfy every constraint within its attempt budget — try reducing your exclusion list or loosening the toggles for stricter output.
          </AlertDescription>
        </Alert>
      )}

      {results.length > 0 && (
        <Card>
          <CardContent className="flex flex-wrap items-center gap-3 p-3">
            <ToggleGroup
              type="single"
              value={orientation}
              onValueChange={(v) => v && setOrientation(v)}
              size="sm"
              variant="outline"
            >
              <ToggleGroupItem value="horizontal">Horizontal</ToggleGroupItem>
              <ToggleGroupItem value="vertical">Vertical</ToggleGroupItem>
            </ToggleGroup>
            <Input
              className="w-28"
              maxLength={8}
              value={sep}
              disabled={orientation === "vertical"}
              title={
                orientation === "vertical"
                  ? "Separator is unused in vertical mode (each number on its own line)."
                  : ""
              }
              onChange={(e) => setSep(e.target.value)}
            />
            <div className="ml-auto">
              <Button size="sm" onClick={copyAll}>
                {allCopied ? (
                  <>
                    <Check className="mr-1 h-3 w-3 text-green-400" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="mr-1 h-3 w-3" /> Copy all
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {results.map((r, i) => (
          <ResultRow
            key={i}
            index={i}
            picks={r.picks}
            max={max}
            onCopy={() => copyRow(i)}
            onExclude={() => excludeRow(i)}
            isExcluded={excludedSet.has(r.picks.join("-"))}
            copiedRow={rowCopied === i}
            savedRow={rowSaved === i}
          />
        ))}
      </div>
    </div>
  );
}
