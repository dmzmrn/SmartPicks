import { cn } from "@/lib/utils";
import { BIRTHDAY_RANGE_MAX } from "@/lib/scoring";

const SIZES = {
  lg: "h-10 w-10 text-sm",
  sm: "h-7 w-7 text-xs",
};

// Numbers past the birthday range are the ones other players choose least,
// so they carry the accent fill; birthday-range numbers stay neutral.
export default function Ball({ n, size = "lg", className }) {
  const pastBirthdayRange = n > BIRTHDAY_RANGE_MAX;
  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold tabular-nums",
        pastBirthdayRange
          ? "bg-primary text-primary-foreground"
          : "border bg-secondary text-secondary-foreground",
        SIZES[size] || SIZES.lg,
        className
      )}
    >
      {String(n).padStart(2, "0")}
    </div>
  );
}

export function BallLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-full bg-primary" /> 32+ · rarely played
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-full border bg-secondary" /> 1–31 · birthday range
      </span>
    </div>
  );
}
