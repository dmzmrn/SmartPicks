import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Settings, Sun, Moon, Monitor, Check, RotateCcw } from "lucide-react";
import { MODES, PRESETS } from "@/lib/theme";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

const MODE_ICONS = { light: Sun, dark: Moon, system: Monitor };

function SettingSection({ title, description, children }) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-medium">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

export default function SettingsDialog() {
  const { mode, preset, setMode, setPreset, reset } = useTheme();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="h-9 w-9" aria-label="Open appearance settings">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Appearance</DialogTitle>
          <DialogDescription>Saved on this device and applied instantly.</DialogDescription>
        </DialogHeader>

        <SettingSection title="Mode" description="System follows your device setting.">
          <ToggleGroup
            type="single"
            variant="outline"
            value={mode}
            onValueChange={(v) => v && setMode(v)}
            className="grid grid-cols-3"
          >
            {MODES.map((m) => {
              const Icon = MODE_ICONS[m.key];
              return (
                <ToggleGroupItem key={m.key} value={m.key} className="gap-2">
                  <Icon className="h-4 w-4" />
                  {m.label}
                </ToggleGroupItem>
              );
            })}
          </ToggleGroup>
        </SettingSection>

        <SettingSection title="Accent" description="Colors buttons, focus rings and highlights.">
          <div className="grid grid-cols-3 gap-2">
            {PRESETS.map((p) => {
              const active = p.key === preset;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPreset(p.key)}
                  aria-pressed={active}
                  className={cn(
                    "flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active && "border-primary"
                  )}
                >
                  <span
                    className="h-4 w-4 shrink-0 rounded-full border border-border"
                    style={{ backgroundColor: p.swatch }}
                  />
                  {p.label}
                  {active && <Check className="ml-auto h-4 w-4" />}
                </button>
              );
            })}
          </div>
        </SettingSection>

        <div className="flex justify-end border-t pt-4">
          <Button variant="ghost" size="sm" onClick={reset} className="gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" /> Reset to defaults
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
