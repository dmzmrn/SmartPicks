import { useRef, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, Download, X, Trash2 } from "lucide-react";
import Ball from "@/components/ball";
import { parseCombosFromText } from "@/lib/parsing";
import { clampRecentN } from "@/lib/storage";
import { cn } from "@/lib/utils";

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
      ? `${excluded.length} stored (none active)`
      : `Excluding ${effectiveCount} of ${excluded.length} stored combinations`;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Exclusion mode</CardTitle>
          <CardDescription>Decide which stored combos block new picks.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {MODES.map((m) => (
              <Button
                key={m}
                size="sm"
                variant={mode === m ? "default" : "secondary"}
                onClick={() => setMode(m)}
                className={cn(mode === m && "accent-grad text-white")}
              >
                {MODE_LABEL[m]}
              </Button>
            ))}
          </div>
          {mode === "recent" && (
            <div className="flex items-end gap-2">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Last N draws</Label>
                <Input
                  type="number"
                  min={10}
                  max={500}
                  className="w-32"
                  value={recentN}
                  onChange={(e) => setRecentN(clampRecentN(e.target.value))}
                />
              </div>
              <span className="pb-2 text-[11px] text-muted-foreground">(10–500)</span>
            </div>
          )}
          <div className="text-xs text-muted-foreground">{status}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Import / Export</CardTitle>
          <CardDescription>Round-trips with `.txt` / `.csv` files.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
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
              <Upload className="mr-2 h-4 w-4" /> Import from file
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={excluded.length === 0}
            >
              <Download className="mr-2 h-4 w-4" /> Export to file
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Manual paste</CardTitle>
          <CardDescription>One combination per line.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            rows={4}
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            placeholder={"e.g.\n14 08 22 50 58 19\n02, 18, 47, 12, 32, 11\n31-16-45-10-47-32"}
          />
          <Button size="sm" onClick={handlePaste} disabled={!paste.trim()}>
            Add to excluded list
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Stored combinations</CardTitle>
            <CardDescription>{excluded.length} stored — {pick}/{max}</CardDescription>
          </div>
          <Button
            variant="destructive"
            size="sm"
            disabled={excluded.length === 0}
            onClick={clearAll}
          >
            <Trash2 className="mr-1 h-3.5 w-3.5" /> Clear all
          </Button>
        </CardHeader>
        <CardContent>
          {excluded.length === 0 ? (
            <div className="rounded-md border border-dashed border-white/[0.08] p-6 text-center text-xs text-muted-foreground">
              No combinations stored yet.
            </div>
          ) : (
            <ScrollArea className="max-h-[320px]">
              <div className="space-y-1.5">
                {excluded.map((combo, idx) => (
                  <div
                    key={`${combo.join("-")}-${idx}`}
                    className="flex items-center justify-between gap-3 rounded-md border border-white/[0.05] bg-white/[0.015] p-2"
                  >
                    <div className="flex flex-wrap gap-1">
                      {combo.map((n, i) => (
                        <Ball key={i} n={n} max={max} size="sm" />
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400"
                      onClick={() => removeAt(idx)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
