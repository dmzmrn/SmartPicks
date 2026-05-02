import { cn } from "@/lib/utils";

const SIZES = {
  lg: { box: "h-12 w-12", text: "text-base" },
  md: { box: "h-10 w-10", text: "text-sm" },
  sm: { box: "h-8 w-8", text: "text-xs" },
};

export default function Ball({ n, max, size = "lg", className }) {
  const hue = (n / Math.max(max, 1)) * 280;
  const style = {
    background: `linear-gradient(135deg, hsl(${hue}, 70%, 55%), hsl(${hue}, 80%, 40%))`,
  };
  const s = SIZES[size] || SIZES.lg;
  return (
    <div
      className={cn(
        "ball-glow inline-flex shrink-0 items-center justify-center rounded-full font-mono font-semibold text-white",
        s.box,
        s.text,
        className
      )}
      style={style}
    >
      {String(n).padStart(2, "0")}
    </div>
  );
}
