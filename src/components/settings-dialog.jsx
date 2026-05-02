import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Settings, Sun, Moon, Check, RotateCcw } from "lucide-react";
import { ACCENTS, MODES, SURFACES } from "@/lib/theme";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

const ModeIcon = ({ mode }) =>
  mode === "dark" ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />;

export default function SettingsDialog() {
  const { mode, accent, surface, setMode, setAccent, setSurface, reset } = useTheme();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="h-9 w-9 rounded-full border border-white/[0.08] bg-white/[0.02] text-muted-foreground hover:text-foreground"
          aria-label="Open settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="surface-card">
        <DialogHeader>
          <DialogTitle>Appearance</DialogTitle>
          <DialogDescription>
            Customize the theme. Choices persist locally.
          </DialogDescription>
        </DialogHeader>

        <section className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Mode
          </Label>
          <div className="flex flex-wrap gap-2">
            {MODES.map((m) => {
              const active = m.key === mode;
              return (
                <Button
                  key={m.key}
                  size="sm"
                  variant={active ? "default" : "secondary"}
                  className={cn("gap-2", active && "accent-grad text-white")}
                  onClick={() => setMode(m.key)}
                >
                  <ModeIcon mode={m.key} />
                  {m.label}
                </Button>
              );
            })}
          </div>
        </section>

        <section className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Accent color
          </Label>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {ACCENTS.map((a) => {
              const active = a.key === accent;
              return (
                <button
                  key={a.key}
                  type="button"
                  onClick={() => setAccent(a.key)}
                  className={cn(
                    "group relative flex h-12 items-center justify-center rounded-md border transition",
                    active
                      ? "border-white/30 ring-2 ring-offset-2 ring-offset-background"
                      : "border-white/[0.08] hover:border-white/20"
                  )}
                  style={{
                    backgroundColor: a.swatch,
                    boxShadow: `0 6px 20px -10px ${a.swatch}`,
                  }}
                  aria-label={`Set accent to ${a.label}`}
                  title={a.label}
                >
                  {active && <Check className="h-4 w-4 text-white drop-shadow" />}
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Dashboard surface
          </Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {SURFACES.map((s) => {
              const active = s.key === surface;
              return (
                <Button
                  key={s.key}
                  size="sm"
                  variant={active ? "default" : "secondary"}
                  className={cn(active && "accent-grad text-white")}
                  onClick={() => setSurface(s.key)}
                >
                  {s.label}
                </Button>
              );
            })}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Changes the body gradient palette behind cards.
          </p>
        </section>

        <div className="flex items-center justify-between pt-2">
          <Button variant="ghost" size="sm" onClick={reset} className="gap-1.5 text-xs">
            <RotateCcw className="h-3 w-3" /> Reset to defaults
          </Button>
          <span className="text-[11px] text-muted-foreground">
            {mode} · {accent} · {surface}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
