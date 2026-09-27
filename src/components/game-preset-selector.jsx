import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PRESETS,
  PRESET_KEYS,
  PICK_MIN,
  PICK_MAX,
  NUM_MIN,
  NUM_MAX,
  clampPick,
  clampMax,
} from "@/lib/presets";

export default function GamePresetSelector({
  presetKey,
  onPresetChange,
  customPick,
  customMax,
  onCustomPickChange,
  onCustomMaxChange,
}) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      {presetKey === "custom" && (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="customPick" className="text-xs text-muted-foreground">
              Pick
            </Label>
            <Input
              id="customPick"
              type="number"
              min={PICK_MIN}
              max={PICK_MAX}
              className="h-9 w-20"
              value={customPick}
              onChange={(e) => onCustomPickChange(clampPick(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="customMax" className="text-xs text-muted-foreground">
              From 1 to
            </Label>
            <Input
              id="customMax"
              type="number"
              min={NUM_MIN}
              max={NUM_MAX}
              className="h-9 w-20"
              value={customMax}
              onChange={(e) => onCustomMaxChange(clampMax(e.target.value))}
            />
          </div>
        </>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="gamePreset" className="text-xs text-muted-foreground">
          Game
        </Label>
        <Select value={presetKey} onValueChange={onPresetChange}>
          <SelectTrigger id="gamePreset" className="h-9 w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRESET_KEYS.map((key) => (
              <SelectItem key={key} value={key}>
                {PRESETS[key].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
