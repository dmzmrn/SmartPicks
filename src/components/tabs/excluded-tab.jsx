import { useRef, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Upload, Download, X, Trash2 } from "lucide-react";
import Ball from "@/components/ball";
import { parseCombosFromText } from "@/lib/parsing";
import { clampRecentN } from "@/lib/storage";

const MODES = ["off", "all-time", "recent"];
const MODE_LABEL = { off: "Off", "all-time": "All-time", recent: "Recent only" };

export default function ExcludedTab({
  pick,
  max,
  excluded,
  setExcluded,
  mode,
  setMode,
  recentN,
  setRecentN,
  effectiveCount,
}) {
  const inputRef = useRef(null);
  const [paste, setPaste] = useState("");

  const addCombos = (combos) => {
    const seen = new Set(excluded.map((c) => c.join("-")));
    let added = 0;
    let dup = 0;
    const out = [...excluded];
    for (const c of combos) {
      const key = c.join("-");
      if (seen.has(key)) {
        dup++;
      } else {
        seen.add(key);
        out.push(c);
        added++;
      }
    }
    setExcluded(out);
    return { added, dup };
  };

  const handleImport = async (file) => {
    try {
      const text = await file.text();
      const { combos, skipped } = parseCombosFromText(text, pick, max);
      const { added, dup } = addCombos(combos);
      toast.success(
        `${file.name}: ${added} combos added, ${dup} duplicates skipped${skipped ? `, ${skipped} unparseable` : ""}`,
        { duration: 5000 }
      );
    } catch (err) {
      console.error(err);
      toast.error("Could not read file");
    }
  };

  const handleExport = () => {
    const ts = new Date();
    const stamp = ts
      .toISOString()
      .replace(/[:.]/g, "-")
      .replace("T", "_")
      .slice(0, 19);
    const lines = [
      "# Lotto Smart Pick - Excluded Combinations",
      `# Game: ${pick}/${max}`,
      `# Exported: ${ts.toLocaleString()}`,
      `# ${excluded.length} combinations`,
      "",
      ...excluded.map((c) => c.map((n) => String(n).padStart(2, "0")).join(" ")),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `excluded-${pick}-${max}-${stamp}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePaste = () => {
    if (!paste.trim()) return;
    const { combos } = parseCombosFromText(paste, pick, max);
    if (combos.length === 0) {
      toast.error(`No valid ${pick}-number combos in 1–${max} range.`);
      return;
    }
    const { added, dup } = addCombos(combos);
    toast.success(`Added ${added} combos, ${dup} duplicates skipped.`);
    setPaste("");
  };

  const removeAt = (idx) => setExcluded(excluded.filter((_, i) => i !== idx));
  const clearAll = () => setExcluded([]);

  const status =
    mode === "off"
      ? `${excluded.length.toLocaleString()} stored · none active`
      : `Excluding ${effectiveCount.toLocaleString()} of ${excluded.length.toLocaleString()} stored combinations`;

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Exclusion mode</CardTitle>
            <CardDescription>Decide which stored combinations block new picks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ToggleGroup
              type="single"
              variant="outline"
              value={mode}
              onValueChange={(v) => v && setMode(v)}
              className="grid grid-cols-3"
              aria-label="Exclusion mode"
            >
              {MODES.map((m) => (
                <ToggleGroupItem key={m} value={m}>
                  {MODE_LABEL[m]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            {mode === "recent" && (
              <div className="space-y-1.5">
                <Label htmlFor="recentN">Most recent combinations (10–500)</Label>
                <Input
                  id="recentN"
                  type="number"
                  min={10}
                  max={500}
                  className="w-32"
                  value={recentN}
                  onChange={(e) => setRecentN(clampRecentN(e.target.value))}
                />
              </div>
            )}
            <p className="text-sm text-muted-foreground">{status}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Import or export</CardTitle>
            <CardDescription>Plain .txt or .csv, one combination per line.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <input
              ref={inputRef}
              type="file"
              accept=".txt,.csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImport(f);
                e.target.value = "";
              }}
            />
            <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" /> Import file
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={excluded.length === 0}
            >
              <Download className="mr-2 h-4 w-4" /> Export file
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Paste combinations</CardTitle>
            <CardDescription>Spaces, commas or dashes all work.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              rows={4}
              className="font-mono"
              aria-label="Combinations to exclude"
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              placeholder={"e.g.\n14 08 22 50 58 19\n02, 18, 47, 12, 32, 11\n31-16-45-10-47-32"}
            />
            <Button size="sm" onClick={handlePaste} disabled={!paste.trim()}>
              Add to excluded list
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-1.5">
            <CardTitle>Stored combinations</CardTitle>
            <CardDescription>
              {excluded.length.toLocaleString()} stored for {pick}/{max}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={excluded.length === 0}
            onClick={clearAll}
            className="gap-1.5 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" /> Clear all
          </Button>
        </CardHeader>
        <CardContent>
          {excluded.length === 0 ? (
            <div className="rounded-md border border-dashed px-6 py-12 text-center text-sm text-muted-foreground">
              Nothing stored yet. Exclude a generated set, import a file, or paste combinations.
            </div>
          ) : (
            <ScrollArea className="rounded-md border [&>[data-radix-scroll-area-viewport]]:max-h-[420px]">
              <ul className="divide-y">
                {excluded.map((combo, idx) => (
                  <li
                    key={`${combo.join("-")}-${idx}`}
                    className="flex items-center justify-between gap-3 px-3 py-2"
                  >
                    <div className="flex flex-wrap gap-1">
                      {combo.map((n) => (
                        <Ball key={n} n={n} size="sm" />
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      aria-label={`Remove ${combo.join(" ")}`}
                      onClick={() => removeAt(idx)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
