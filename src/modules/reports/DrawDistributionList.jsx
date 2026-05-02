import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";

const COLUMNS = [
  { key: "index", label: "#" },
  { key: "numbers", label: "Numbers" },
  { key: "sum", label: "Sum" },
  { key: "oe", label: "O/E" },
  { key: "lh", label: "L/H" },
];

const SortIcon = ({ active, dir }) => {
  if (!active) return <ArrowUpDown className="h-3 w-3 opacity-50" />;
  return dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
};

export default function DrawDistributionList({ drawStats }) {
  const [sort, setSort] = useState({ key: "index", dir: "asc" });

  const sorted = useMemo(() => {
    const accessor = (d) => {
      if (sort.key === "oe") return d.odd * 100 + d.even;
      if (sort.key === "lh") return d.low * 100 + d.high;
      if (sort.key === "numbers") return d.numbers.join(",");
      return d[sort.key];
    };
    const arr = [...drawStats].sort((a, b) => {
      const av = accessor(a);
      const bv = accessor(b);
      if (av < bv) return sort.dir === "asc" ? -1 : 1;
      if (av > bv) return sort.dir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [drawStats, sort]);

  const cycle = (key) => {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Past draws</CardTitle>
        <CardDescription>Sortable — click a column to cycle asc/desc.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-2 flex flex-wrap gap-1">
          {COLUMNS.map((c) => (
            <Button
              key={c.key}
              variant={sort.key === c.key ? "secondary" : "ghost"}
              size="sm"
              onClick={() => cycle(c.key)}
              className="h-7 gap-1.5 px-2 text-[11px]"
            >
              <SortIcon active={sort.key === c.key} dir={sort.dir} />
              {c.label}
            </Button>
          ))}
        </div>
        <ScrollArea className="h-[360px] rounded-md border border-white/[0.06]">
          <table className="w-full text-sm font-mono">
            <thead className="sticky top-0 bg-background/95 backdrop-blur">
              <tr className="border-b border-white/[0.06] text-xs text-muted-foreground">
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">Numbers</th>
                <th className="px-3 py-2 text-right">Sum</th>
                <th className="px-3 py-2 text-right">O/E</th>
                <th className="px-3 py-2 text-right">L/H</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((d) => (
                <tr key={d.index} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="px-3 py-1.5 text-slate-400">{String(d.index).padStart(3, "0")}</td>
                  <td className="px-3 py-1.5 text-slate-200">
                    {d.numbers.map((n) => String(n).padStart(2, "0")).join("  ")}
                  </td>
                  <td className="px-3 py-1.5 text-right accent-text-soft">{d.sum}</td>
                  <td className="px-3 py-1.5 text-right text-slate-400">{d.odd}/{d.even}</td>
                  <td className="px-3 py-1.5 text-right text-slate-400">{d.low}/{d.high}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
