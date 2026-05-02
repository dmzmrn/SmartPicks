import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PRESETS, PRESET_KEYS, clampPick, clampMax } from "@/lib/presets";
import { cn } from "@/lib/utils";

export default function GamePresetSelector({
  presetKey,
  onPresetChange,
  customPick,
  customMax,
  onCustomPickChange,
  onCustomMaxChange,
  resolvedLabel,
  resolvedSchedule,
  resolvedPick,
  resolvedMax,
}) {
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap gap-2">
          {PRESET_KEYS.map((key) => {
            const active = key === presetKey;
            return (
              <Button
                key={key}
                size="sm"
                variant={active ? "default" : "secondary"}
                onClick={() => onPresetChange(key)}
                className={cn(active && "accent-grad text-white")}
              >
                {key === "custom" ? "Custom" : PRESETS[key].label.replace(/^.*?\s/, "").replace(" Lotto", "")}
                <span className="ml-2 text-[10px] opacity-70">
                  {key === "custom" ? `${resolvedPick}/${resolvedMax}` : key}
                </span>
              </Button>
            );
          })}
        </div>

        {presetKey === "custom" && (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Pick</Label>
              <Input
                type="number"
                min={1}
                max={20}
                value={customPick}
                onChange={(e) => onCustomPickChange(clampPick(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Max</Label>
              <Input
                type="number"
                min={2}
                max={99}
                value={customMax}
                onChange={(e) => onCustomMaxChange(clampMax(e.target.value))}
              />
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <span className="accent-text-soft">{resolvedLabel}</span>
          {resolvedSchedule && (
            <>
              {" — Draw schedule: "}
              <span className="text-slate-300">{resolvedSchedule}</span>
              {" at 9PM"}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
