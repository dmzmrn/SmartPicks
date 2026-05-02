import { cn } from "@/lib/utils";

export default function ResultStats({ stats }) {
  const { sum, z, low, high, even, odd, spread } = stats;
  const zColor =
    z >= 0.5
      ? "text-green-400"
      : z <= -0.5
      ? "text-amber-400"
      : "text-slate-400";
  const zStr = `${z >= 0 ? "+" : ""}${z.toFixed(2)}`;

  return (
    <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] text-slate-500">
      <span>Σ {sum}</span>
      <span className={cn(zColor)}>z{zStr}</span>
      <span>L{low}·H{high}</span>
      <span>E{even}·O{odd}</span>
      <span>span {spread}</span>
    </div>
  );
}
